//! Phase 5 SmartSwitch: desktop state snapshot, priority-aware profile
//! resolution, game-exit replay, and a bounded transition history.
//! Every transition is replayed through the same documented display/color
//! commands used by the UI. No game file, process, or anti-cheat is touched.

use crate::color::ColorPayload;
use crate::display::{DisplayApplyRequest, DisplayMode};
use parking_lot::Mutex;
use serde::{Deserialize, Serialize};
use serde_json::json;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::time::Duration;
use tauri::{AppHandle, Emitter};

pub const POLL_INTERVAL_MS: u64 = 1_500;
pub const EXIT_GRACE_POLLS: u8 = 2;
pub const MAX_PROFILES: usize = 200;
pub const MAX_HISTORY: usize = 100;

static POLLING: AtomicBool = AtomicBool::new(false);

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SwitchProfile {
    pub id: String,
    pub game: String,
    #[serde(default)]
    pub priority: i32,
    #[serde(default)]
    pub enabled: bool,
    pub color: ColorPayload,
    #[serde(default)]
    pub display: Option<DisplayMode>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SwitchRecord {
    pub time: i64,
    pub game: String,
    pub action: String,
    pub detail: String,
    pub priority: i32,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SwitchStatus {
    pub enabled: bool,
    pub current_game: Option<String>,
    pub current_profile: Option<String>,
    pub profile_count: usize,
    pub history_count: usize,
    pub poll_interval_ms: u64,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SwitchEvent {
    pub kind: String,
    pub game: String,
    pub profile_id: Option<String>,
    pub priority: i32,
    pub restored: bool,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum SwitchAction {
    None,
    Switch,
    Restore,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TransitionPlan {
    pub action: SwitchAction,
    pub restore_first: bool,
    pub profile_id: Option<String>,
    pub priority: i32,
}

impl Default for TransitionPlan {
    fn default() -> Self {
        Self { action: SwitchAction::None, restore_first: false, profile_id: None, priority: 0 }
    }
}

/// Highest priority wins. Equal priorities resolve by id so two conflicting
/// profiles can never produce a platform-dependent winner.
pub fn resolve_profile<'a>(profiles: &'a [SwitchProfile], game: &str) -> Option<&'a SwitchProfile> {
    let needle = game.trim().to_lowercase();
    if needle.is_empty() {
        return None;
    }
    let mut candidates: Vec<&SwitchProfile> = profiles.iter()
        .filter(|profile| profile.enabled && profile.game.trim().to_lowercase() == needle)
        .collect();
    candidates.sort_by(|left, right| {
        right.priority.cmp(&left.priority).then_with(|| left.id.cmp(&right.id))
    });
    candidates.into_iter().next()
}

/// Pure transition planner. A direct A -> B switch restores A's snapshot
/// before B is applied; a missing game restores after the exit grace window.
pub fn plan_transition(
    profiles: &[SwitchProfile],
    enabled: bool,
    current_profile: Option<&str>,
    game: Option<&str>,
) -> TransitionPlan {
    if !enabled {
        return TransitionPlan::default();
    }
    let Some(name) = game else {
        return if current_profile.is_some() {
            TransitionPlan { action: SwitchAction::Restore, ..TransitionPlan::default() }
        } else {
            TransitionPlan::default()
        };
    };
    match resolve_profile(profiles, name) {
        Some(profile) if Some(profile.id.as_str()) == current_profile => TransitionPlan::default(),
        Some(profile) => TransitionPlan {
            action: SwitchAction::Switch,
            restore_first: current_profile.is_some(),
            profile_id: Some(profile.id.clone()),
            priority: profile.priority,
        },
        None if current_profile.is_some() => {
            TransitionPlan { action: SwitchAction::Restore, ..TransitionPlan::default() }
        }
        None => TransitionPlan::default(),
    }
}

#[derive(Default)]
struct Inner {
    enabled: bool,
    profiles: Vec<SwitchProfile>,
    baseline: Option<ColorPayload>,
    current_game: Option<String>,
    current_profile: Option<String>,
    display_applied: bool,
    absent_polls: u8,
    history: Vec<SwitchRecord>,
}

pub struct SmartSwitch {
    inner: Mutex<Inner>,
    app: AppHandle,
}

impl SmartSwitch {
    pub fn new(app: AppHandle) -> Self {
        Self { inner: Mutex::new(Inner::default()), app }
    }

    pub fn status(&self) -> SwitchStatus {
        let state = self.inner.lock();
        SwitchStatus {
            enabled: state.enabled,
            current_game: state.current_game.clone(),
            current_profile: state.current_profile.clone(),
            profile_count: state.profiles.len(),
            history_count: state.history.len(),
            poll_interval_ms: POLL_INTERVAL_MS,
        }
    }

    pub fn history(&self, limit: usize) -> Vec<SwitchRecord> {
        let state = self.inner.lock();
        state.history.iter().rev().take(limit.min(MAX_HISTORY)).cloned().collect()
    }

    /// The caller supplies the real desktop color state; no baseline is
    /// invented when color controls are unavailable.
    pub fn set_enabled(&self, enabled: bool, desktop_color: Option<ColorPayload>) -> Result<SwitchStatus, String> {
        let was_active;
        {
            let mut state = self.inner.lock();
            if enabled && desktop_color.is_none() && state.baseline.is_none() {
                return Err("desktop color snapshot is required".to_owned());
            }
            if enabled && desktop_color.is_some() {
                state.baseline = desktop_color;
            }
            state.enabled = enabled;
            state.absent_polls = 0;
            was_active = state.current_profile.is_some();
        }
        if !enabled && was_active {
            self.restore("desktop")?;
        }
        self.emit(SwitchEvent {
            kind: if enabled { "enabled" } else { "disabled" }.to_owned(),
            game: String::new(),
            profile_id: None,
            priority: 0,
            restored: !enabled,
        });
        Ok(self.status())
    }

    pub fn sync_profiles(&self, profiles: Vec<SwitchProfile>) -> Result<SwitchStatus, String> {
        if profiles.len() > MAX_PROFILES {
            return Err(format!("too many switch profiles (max {MAX_PROFILES})"));
        }
        for profile in &profiles {
            if crate::security::safe_id(&profile.id).is_none() {
                return Err("invalid switch profile id".to_owned());
            }
            if crate::security::safe_text(&profile.game, 120).is_empty() {
                return Err("switch profile game name is empty".to_owned());
            }
        }
        {
            let mut state = self.inner.lock();
            state.profiles = profiles;
        }
        if let Some(app_state) = crate::APP_STATE.get() {
            for profile in self.inner.lock().profiles.iter() {
                let serialized = serde_json::to_string(profile).map_err(|error| error.to_string())?;
                crate::security::bounded_json(&serde_json::from_str::<serde_json::Value>(&serialized)
                    .map_err(|error| error.to_string())?)?;
                app_state.storage.upsert("smart-switch-profile", &profile.id, &serialized)?;
            }
        }
        self.emit(SwitchEvent {
            kind: "profiles".to_owned(),
            game: String::new(),
            profile_id: None,
            priority: 0,
            restored: false,
        });
        Ok(self.status())
    }

    /// Called by the native poll loop with the current foreground game name.
    pub fn observe(&self, game: Option<&str>) -> Result<(), String> {
        let plan = {
            let mut state = self.inner.lock();
            let current_profile = state.current_profile.clone();
            if game.is_some() {
                state.absent_polls = 0;
            } else if current_profile.is_some() {
                state.absent_polls = state.absent_polls.saturating_add(1);
            }
            let hold_previous = state.current_profile.is_some() && state.absent_polls < EXIT_GRACE_POLLS;
            let effective = if hold_previous { state.current_game.clone() } else { game.map(str::to_owned) };
            plan_transition(&state.profiles, state.enabled, current_profile.as_deref(), effective.as_deref())
        };

        match plan.action {
            SwitchAction::None => Ok(()),
            SwitchAction::Restore => self.restore(game.unwrap_or("desktop")),
            SwitchAction::Switch => {
                let profile = {
                    let state = self.inner.lock();
                    let id = plan.profile_id.as_deref().ok_or_else(|| "missing switch profile".to_owned())?;
                    state.profiles.iter().find(|item| item.id == id).cloned()
                        .ok_or_else(|| "switch profile no longer registered".to_owned())?
                };
                self.switch_to(profile, plan.restore_first)
            }
        }
    }

    fn restore(&self, game: &str) -> Result<(), String> {
        let (baseline, display_applied) = {
            let state = self.inner.lock();
            (state.baseline.clone(), state.display_applied)
        };
        let app_state = crate::APP_STATE.get().ok_or_else(|| "native state unavailable".to_owned())?;
        if let Some(color) = baseline {
            let result = app_state.color.apply(&color)?;
            if !result.ok {
                return Err(result.message);
            }
        }
        if display_applied {
            let _ = app_state.display.rollback(None);
        }
        {
            let mut state = self.inner.lock();
            state.current_game = None;
            state.current_profile = None;
            state.display_applied = false;
            state.absent_polls = 0;
            push_history(&mut state, game, "restore", "desktop color and display replayed", 0);
        }
        self.emit(SwitchEvent {
            kind: "restore".to_owned(),
            game: game.to_owned(),
            profile_id: None,
            priority: 0,
            restored: true,
        });
        Ok(())
    }

    fn switch_to(&self, profile: SwitchProfile, restore_first: bool) -> Result<(), String> {
        if restore_first {
            self.restore(&profile.game)?;
        }
        let app_state = crate::APP_STATE.get().ok_or_else(|| "native state unavailable".to_owned())?;
        let color_result = app_state.color.apply(&profile.color)?;
        if !color_result.ok {
            return Err(color_result.message);
        }
        let mut display_applied = false;
        if let Some(mode) = profile.display.as_ref() {
            let device = crate::display::enumerate().into_iter()
                .find(|device| device.is_primary)
                .or_else(|| crate::display::enumerate().into_iter().next())
                .map(|device| device.id);
            if let Some(device_id) = device {
                let result = app_state.display.apply(DisplayApplyRequest {
                    device_id,
                    width: mode.width,
                    height: mode.height,
                    refresh_rate: mode.refresh_rate,
                })?;
                display_applied = result.ok;
            }
        }
        {
            let mut state = self.inner.lock();
            state.current_game = Some(profile.game.clone());
            state.current_profile = Some(profile.id.clone());
            state.display_applied = display_applied;
            state.absent_polls = 0;
            push_history(&mut state, &profile.game, "switch", &profile.id, profile.priority);
        }
        self.emit(SwitchEvent {
            kind: "switch".to_owned(),
            game: profile.game,
            profile_id: Some(profile.id),
            priority: profile.priority,
            restored: false,
        });
        Ok(())
    }

    fn emit(&self, event: SwitchEvent) {
        let _ = self.app.emit("vytrix://smart-switch", &event);
    }

    /// One bounded polling thread per process. Emits only on planned changes.
    pub fn spawn_polling(switch: Arc<Self>) {
        if POLLING.swap(true, Ordering::SeqCst) {
            return;
        }
        std::thread::Builder::new()
            .name("vytrix-smart-switch".to_owned())
            .spawn(move || {
                while POLLING.load(Ordering::Relaxed) {
                    let game = crate::games::detect_foreground().map(|detected| detected.display_name);
                    if let Some(app_state) = crate::APP_STATE.get() {
                        app_state.overlay.apply_game_visibility(game.as_deref());
                    }
                    if let Err(error) = switch.observe(game.as_deref()) {
                        let _ = switch.app.emit("vytrix://smart-switch", json!({
                            "kind": "error",
                            "game": game.clone().unwrap_or_default(),
                            "profileId": null,
                            "priority": 0,
                            "restored": false,
                            "detail": error,
                        }));
                    }
                    std::thread::sleep(Duration::from_millis(POLL_INTERVAL_MS));
                }
            })
            .ok();
    }
}

fn push_history(state: &mut Inner, game: &str, action: &str, detail: &str, priority: i32) {
    state.history.push(SwitchRecord {
        time: chrono::Utc::now().timestamp_millis(),
        game: crate::security::safe_text(game, 120),
        action: action.to_owned(),
        detail: crate::security::safe_text(detail, 160),
        priority,
    });
    if state.history.len() > MAX_HISTORY {
        state.history.drain(..state.history.len() - MAX_HISTORY);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn profile(id: &str, game: &str, priority: i32, enabled: bool) -> SwitchProfile {
        SwitchProfile {
            id: id.to_owned(),
            game: game.to_owned(),
            priority,
            enabled,
            color: ColorPayload::default(),
            display: None,
        }
    }

    #[test]
    fn highest_priority_wins_and_disabled_profiles_are_ignored() {
        let profiles = [
            profile("low", "Rob Run", 1, true),
            profile("winner", "Rob Run", 10, true),
            profile("disabled", "Rob Run", 99, false),
            profile("other", "Other", 50, true),
        ];
        let resolved = resolve_profile(&profiles, "rob run").expect("expected a winner");
        assert_eq!(resolved.id, "winner");
    }

    #[test]
    fn equal_priority_resolves_deterministically_by_id() {
        let profiles = [profile("b", "Game", 5, true), profile("a", "Game", 5, true)];
        let resolved = resolve_profile(&profiles, "Game").expect("expected a winner");
        assert_eq!(resolved.id, "a");
    }

    #[test]
    fn conflicting_switch_restores_previous_profile_first() {
        let profiles = [profile("a", "A", 1, true), profile("b", "B", 2, true)];
        let plan = plan_transition(&profiles, true, Some("a"), Some("B"));
        assert_eq!(plan.action, SwitchAction::Switch);
        assert!(plan.restore_first);
        assert_eq!(plan.profile_id.as_deref(), Some("b"));
        assert_eq!(plan.priority, 2);
    }

    #[test]
    fn game_exit_plans_a_restore_and_disabled_switch_is_inert() {
        let profiles = [profile("a", "A", 1, true)];
        let exit = plan_transition(&profiles, true, Some("a"), None);
        assert_eq!(exit.action, SwitchAction::Restore);
        let disabled = plan_transition(&profiles, false, Some("a"), Some("B"));
        assert_eq!(disabled.action, SwitchAction::None);
    }

    #[test]
    fn repeated_profile_detection_is_idempotent() {
        let profiles = [profile("a", "A", 1, true)];
        let plan = plan_transition(&profiles, true, Some("a"), Some("A"));
        assert_eq!(plan.action, SwitchAction::None);
    }
}
