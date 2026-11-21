//! Overlay window lifecycle. Transparent, always-on-top, click-through.
//! The overlay never injects into games and never reads game memory.

use parking_lot::Mutex;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tauri::{AppHandle, Emitter, Manager};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CrosshairView {
    pub id: String,
    pub name: String,
    pub style: String,
    pub color: String,
    pub thickness: i32,
    pub gap: i32,
    pub length: i32,
    pub opacity: f64,
    pub outline: bool,
    pub center_dot: bool,
    pub rotation: i32,
    pub scale: f64,
    pub monitor_id: Option<String>,
    pub offset_x: i32,
    pub offset_y: i32,
}

impl Default for CrosshairView {
    fn default() -> Self {
        Self {
            id: "default-dot".to_owned(),
            name: "Precision Dot".to_owned(),
            style: "dot".to_owned(),
            color: "#00D9FF".to_owned(),
            thickness: 2,
            gap: 0,
            length: 4,
            opacity: 0.9,
            outline: true,
            center_dot: true,
            rotation: 0,
            scale: 1.0,
            monitor_id: None,
            offset_x: 0,
            offset_y: 0,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ZoomView {
    pub enabled: bool,
    pub level: f64,
    pub label: Option<String>,
}

impl Default for ZoomView {
    fn default() -> Self {
        Self { enabled: false, level: 1.0, label: None }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GameVisibilityView {
    #[serde(default)]
    pub hidden_for_games: Vec<String>,
    #[serde(default)]
    pub only_for_games: Vec<String>,
}

impl Default for GameVisibilityView {
    fn default() -> Self {
        Self { hidden_for_games: Vec::new(), only_for_games: Vec::new() }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OverlayView {
    pub crosshair_enabled: bool,
    pub crosshair: CrosshairView,
    pub zoom: ZoomView,
    pub hotkey_hint: Option<String>,
    #[serde(default = "default_layout")]
    pub layout: String,
    #[serde(default)]
    pub game_visibility: GameVisibilityView,
    #[serde(default = "default_visible_for_game")]
    pub visible_for_game: bool,
}

fn default_layout() -> String { "center".to_owned() }
fn default_visible_for_game() -> bool { true }

impl Default for OverlayView {
    fn default() -> Self {
        Self {
            crosshair_enabled: false,
            crosshair: CrosshairView::default(),
            zoom: ZoomView::default(),
            hotkey_hint: None,
            layout: default_layout(),
            game_visibility: GameVisibilityView::default(),
            visible_for_game: default_visible_for_game(),
        }
    }
}

fn bounded_text(value: &str, max: usize, fallback: &str) -> String {
    let cleaned = crate::security::safe_text(value, max);
    if cleaned.is_empty() { fallback.to_owned() } else { cleaned }
}

pub fn sanitize(view: OverlayView) -> OverlayView {
    let styles = ["dot", "circle", "cross", "dynamic-cross"];
    let mut crosshair = view.crosshair;
    crosshair.id = bounded_text(&crosshair.id, 120, "custom");
    crosshair.name = bounded_text(&crosshair.name, 80, "Custom");
    if !styles.contains(&crosshair.style.as_str()) { crosshair.style = "dot".to_owned(); }
    if !crate::security::safe_text(&crosshair.color, 16).starts_with('#') {
        crosshair.color = "#00D9FF".to_owned();
    }
    if !crosshair.color.chars().skip(1).all(|c| c.is_ascii_hexdigit()) || crosshair.color.len() != 7 {
        crosshair.color = "#00D9FF".to_owned();
    }
    crosshair.thickness = crate::security::clamp(crosshair.thickness as f64, 1.0, 12.0) as i32;
    crosshair.gap = crate::security::clamp(crosshair.gap as f64, 0.0, 40.0) as i32;
    crosshair.length = crate::security::clamp(crosshair.length as f64, 2.0, 40.0) as i32;
    crosshair.opacity = crate::security::clamp(crosshair.opacity, 0.1, 1.0);
    crosshair.rotation = crate::security::clamp(crosshair.rotation as f64, 0.0, 360.0) as i32;
    crosshair.scale = crate::security::clamp(crosshair.scale, 0.5, 3.0);
    crosshair.offset_x = crate::security::clamp(crosshair.offset_x as f64, -2000.0, 2000.0) as i32;
    crosshair.offset_y = crate::security::clamp(crosshair.offset_y as f64, -2000.0, 2000.0) as i32;
    crosshair.monitor_id = crosshair.monitor_id.as_deref().and_then(crate::security::safe_id);

    let mut zoom = view.zoom;
    zoom.level = crate::security::clamp(zoom.level, 1.0, 8.0);
    zoom.label = zoom.label.as_deref().map(|label| bounded_text(label, 40, "1.0x")).filter(|_| zoom.level > 1.0);

    let layouts = ["center", "top-left", "top-right", "bottom-left", "bottom-right"];
    let layout = if layouts.contains(&view.layout.as_str()) { view.layout } else { default_layout() };
    let clean_games = |list: Vec<String>| -> Vec<String> {
        list.into_iter()
            .map(|name| bounded_text(&name, 120, ""))
            .filter(|name| !name.is_empty())
            .take(50)
            .collect()
    };
    let game_visibility = GameVisibilityView {
        hidden_for_games: clean_games(view.game_visibility.hidden_for_games),
        only_for_games: clean_games(view.game_visibility.only_for_games),
    };

    OverlayView {
        crosshair_enabled: view.crosshair_enabled,
        crosshair,
        zoom,
        hotkey_hint: view.hotkey_hint.as_deref().map(|hint| bounded_text(hint, 80, "")).filter(|hint| !hint.is_empty()),
        layout,
        game_visibility,
        visible_for_game: view.visible_for_game,
    }
}

#[derive(Clone)]
pub struct OverlayState {
    inner: Arc<Mutex<OverlayView>>,
    app: AppHandle,
}

impl OverlayState {
    pub fn new(app: AppHandle) -> Self {
        Self { inner: Arc::new(Mutex::new(OverlayView::default())), app }
    }

    pub fn view(&self) -> OverlayView {
        self.inner.lock().clone()
    }

    pub fn set(&self, view: OverlayView) -> OverlayView {
        let sanitized = sanitize(view);
        *self.inner.lock() = sanitized.clone();
        self.sync_window(&sanitized);
        let _ = self.app.emit("vytrix://overlay-config", &sanitized);
        sanitized
    }

    pub fn toggle_crosshair(&self) -> OverlayView {
        let mut view = self.view();
        view.crosshair_enabled = !view.crosshair_enabled;
        self.set(view)
    }

    pub fn sync(&self) {
        let view = self.inner.lock().clone();
        self.sync_window(&view);
    }

    fn sync_window(&self, view: &OverlayView) {
        if let Some(window) = self.app.get_webview_window("overlay") {
            let should_show = view.visible_for_game
                && (view.crosshair_enabled || view.zoom.enabled || view.hotkey_hint.is_some());
            if should_show {
                let _ = window.show();
            } else {
                let _ = window.hide();
            }
            let _ = window.set_ignore_cursor_events(true);
        }
    }

    /// Recomputes per-game visibility from the foreground title. No rule is
    /// ever evaluated against a game the app has not actually detected.
    pub fn apply_game_visibility(&self, game: Option<&str>) -> bool {
        let visible = {
            let state = self.inner.lock();
            game_is_visible(&state.game_visibility, game)
        };
        let view = {
            let mut state = self.inner.lock();
            if state.visible_for_game == visible { return visible; }
            state.visible_for_game = visible;
            state.clone()
        };
        self.sync_window(&view);
        let _ = self.app.emit("vytrix://overlay-config", &view);
        visible
    }
}

/// Pure per-game visibility decision. Hidden rules win over allow rules.
pub fn game_is_visible(rules: &GameVisibilityView, game: Option<&str>) -> bool {
    match game.map(|name| name.trim().to_lowercase()) {
        None => true,
        Some(name) => {
            let matches = |list: &Vec<String>| {
                list.iter().any(|item| {
                    let needle = item.trim().to_lowercase();
                    !needle.is_empty() && name.contains(&needle)
                })
            };
            !matches(&rules.hidden_for_games)
                && (rules.only_for_games.is_empty() || matches(&rules.only_for_games))
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn clamps_crosshair() {
        let mut view = OverlayView::default();
        view.crosshair.thickness = 99;
        view.crosshair.opacity = 4.0;
        view.crosshair.style = "malicious".to_owned();
        view.crosshair.color = "javascript:alert(1)".to_owned();
        let clean = sanitize(view);
        assert_eq!(clean.crosshair.thickness, 12);
        assert_eq!(clean.crosshair.opacity, 1.0);
        assert_eq!(clean.crosshair.style, "dot");
        assert_eq!(clean.crosshair.color, "#00D9FF");
    }

    #[test]
    fn drops_zoom_label_at_identity_level() {
        let mut view = OverlayView::default();
        view.zoom.label = Some("2.0x".to_owned());
        assert_eq!(sanitize(view).zoom.label, None);
    }

    #[test]
    fn layout_is_whitelisted_and_game_lists_are_bounded() {
        let mut view = OverlayView::default();
        view.layout = "../../evil".to_owned();
        view.game_visibility.hidden_for_games = vec![" Rob Run ".to_owned(), "  ".to_owned()];
        let clean = sanitize(view);
        assert_eq!(clean.layout, "center");
        assert_eq!(clean.game_visibility.hidden_for_games, vec!["Rob Run"]);
    }

    #[test]
    fn hidden_rule_beats_allow_rule_and_unknown_game_is_visible() {
        let rules = GameVisibilityView {
            hidden_for_games: vec!["rob".to_owned()],
            only_for_games: vec!["rob".to_owned(), "valorant".to_owned()],
        };
        assert!(!game_is_visible(&rules, Some("ROB RUN")));
        assert!(game_is_visible(&rules, Some("Valorant")));
        assert!(!game_is_visible(&rules, Some("Apex")));
        assert!(game_is_visible(&rules, None));
    }

    #[test]
    fn allow_list_hides_games_that_are_not_named() {
        let rules = GameVisibilityView {
            hidden_for_games: Vec::new(),
            only_for_games: vec!["rob run".to_owned()],
        };
        assert!(game_is_visible(&rules, Some("Rob Run")));
        assert!(!game_is_visible(&rules, Some("Cs2")));
    }
}
