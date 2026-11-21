//! LAN-only Phone Control agent. Explicit pairing, short-lived bearer token,
//! bounded request bodies. No cloud relay, no UPnP, no firewall rule creation.

use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::io::{Read, Write};
use std::net::{TcpStream, UdpSocket};
use parking_lot::Mutex;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::thread::{self, JoinHandle};
use std::time::{Duration, Instant};
use tauri::Emitter;
use tiny_http::{Header, Method, Response, Server};

pub const DEFAULT_PORT: u16 = 8753;
const MAX_BODY_BYTES: usize = 16 * 1024;
const SESSION_TTL: Duration = Duration::from_secs(300);
const PAIR_TTL: Duration = Duration::from_secs(300);

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ColorSettingsView {
    pub saturation: f64,
    pub vibrance: f64,
    pub gamma: f64,
    pub brightness: f64,
    pub contrast: f64,
    pub hue: f64,
    pub red: f64,
    pub green: f64,
    pub blue: f64,
    pub temperature_k: Option<f64>,
}

impl Default for ColorSettingsView {
    fn default() -> Self {
        Self {
            saturation: 100.0,
            vibrance: 100.0,
            gamma: 100.0,
            brightness: 100.0,
            contrast: 100.0,
            hue: 0.0,
            red: 100.0,
            green: 100.0,
            blue: 100.0,
            temperature_k: Some(6500.0),
        }
    }
}

fn number_field(body: &Value, key: &str, min: f64, max: f64, default: f64) -> f64 {
    match body.get(key) {
        Some(Value::Number(number)) => number
            .as_f64()
            .map(|value| crate::security::clamp(value, min, max))
            .unwrap_or(default),
        _ => default,
    }
}

fn parse_color(body: &Value) -> Result<ColorSettingsView, String> {
    if !body.is_object() {
        return Err("color settings must be an object".to_owned());
    }
    let temperature_k = match body.get("temperatureK") {
        None | Some(Value::Null) => None,
        Some(Value::Number(number)) => number
            .as_f64()
            .map(|value| Some(crate::security::clamp(value, 1000.0, 12000.0)))
            .unwrap_or(Some(6500.0)),
        _ => Some(6500.0),
    };
    Ok(ColorSettingsView {
        saturation: number_field(body, "saturation", 0.0, 300.0, 100.0),
        vibrance: number_field(body, "vibrance", 0.0, 300.0, 100.0),
        gamma: number_field(body, "gamma", 50.0, 250.0, 100.0),
        brightness: number_field(body, "brightness", 0.0, 200.0, 100.0),
        contrast: number_field(body, "contrast", 0.0, 200.0, 100.0),
        hue: number_field(body, "hue", 0.0, 360.0, 0.0),
        red: number_field(body, "red", 0.0, 200.0, 100.0),
        green: number_field(body, "green", 0.0, 200.0, 100.0),
        blue: number_field(body, "blue", 0.0, 200.0, 100.0),
        temperature_k,
    })
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PhonePreset {
    pub id: String,
    pub name: String,
    pub category: String,
    pub thumbnail: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PhonePermissions {
    pub saturation: bool,
    pub vibrance: bool,
    pub gamma: bool,
    pub brightness: bool,
    pub presets: bool,
    pub crosshair: bool,
    pub effects: bool,
}

impl Default for PhonePermissions {
    fn default() -> Self {
        Self {
            saturation: true,
            vibrance: true,
            gamma: true,
            brightness: true,
            presets: true,
            crosshair: false,
            effects: false,
        }
    }
}

#[derive(Debug)]
struct AgentInner {
    enabled: bool,
    port: u16,
    host: String,
    code: Option<String>,
    code_deadline: Option<Instant>,
    token: Option<String>,
    token_deadline: Option<Instant>,
    color: ColorSettingsView,
    preset_id: Option<String>,
    crosshair_enabled: bool,
    permissions: PhonePermissions,
    presets: Vec<PhonePreset>,
}

impl AgentInner {
    fn default_for(host: String) -> Self {
        Self {
            enabled: false,
            port: DEFAULT_PORT,
            host,
            code: None,
            code_deadline: None,
            token: None,
            token_deadline: None,
            color: ColorSettingsView::default(),
            preset_id: None,
            crosshair_enabled: false,
            permissions: PhonePermissions::default(),
            presets: Vec::new(),
        }
    }
}

fn merge_color(
    current: &ColorSettingsView,
    incoming: ColorSettingsView,
    permissions: &PhonePermissions,
) -> ColorSettingsView {
    let mut result = current.clone();
    if permissions.saturation { result.saturation = incoming.saturation; }
    if permissions.vibrance { result.vibrance = incoming.vibrance; }
    if permissions.gamma { result.gamma = incoming.gamma; }
    if permissions.brightness { result.brightness = incoming.brightness; }
    if permissions.effects {
        result.contrast = incoming.contrast;
        result.hue = incoming.hue;
        result.red = incoming.red;
        result.green = incoming.green;
        result.blue = incoming.blue;
        result.temperature_k = incoming.temperature_k;
    }
    result
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PhoneSession {
    pub enabled: bool,
    pub port: u16,
    pub host: String,
    pub code: String,
    pub paired: bool,
    pub expires_at: i64,
    pub pairing_expires_at: i64,
}

fn deadline_millis(deadline: Option<Instant>) -> i64 {
    match deadline {
        Some(value) => {
            let remaining = value.saturating_duration_since(Instant::now());
            chrono::Utc::now().timestamp_millis() + remaining.as_millis() as i64
        }
        None => 0,
    }
}

fn random_code() -> String {
    let mut rng = rand::thread_rng();
    format!("{:06}", rand::Rng::gen_range(&mut rng, 0..1_000_000u32))
}

fn random_token() -> String {
    let mut bytes = [0u8; 24];
    rand::Rng::fill(&mut rand::thread_rng(), &mut bytes);
    hex::encode(bytes)
}

fn lan_address() -> String {
    // UDP connect selects a route without sending a packet; no network traffic.
    UdpSocket::bind("0.0.0.0:0")
        .and_then(|socket| socket.connect("198.51.100.1:80").map(|_| socket))
        .ok()
        .and_then(|socket| socket.local_addr().ok())
        .map(|address| address.ip().to_string())
        .unwrap_or_else(|| "127.0.0.1".to_owned())
}

#[derive(Clone)]
pub struct PhoneAgent {
    inner: Arc<Mutex<AgentInner>>,
    running: Arc<AtomicBool>,
    thread: Arc<Mutex<Option<JoinHandle<()>>>>,
    app: tauri::AppHandle,
}

impl PhoneAgent {
    pub fn new(app: tauri::AppHandle) -> Self {
        Self {
            inner: Arc::new(Mutex::new(AgentInner::default_for(lan_address()))),
            running: Arc::new(AtomicBool::new(false)),
            thread: Arc::new(Mutex::new(None)),
            app,
        }
    }

    pub fn session(&self) -> PhoneSession {
        let inner = self.inner.lock();
        PhoneSession {
            enabled: inner.enabled,
            port: inner.port,
            host: inner.host.clone(),
            code: inner.code.clone().unwrap_or_default(),
            paired: inner.token.is_some() && inner.token_deadline.is_some_and(|d| d > Instant::now()),
            expires_at: deadline_millis(inner.token_deadline),
            pairing_expires_at: deadline_millis(inner.code_deadline),
        }
    }

    pub fn start(&self, port: u16) -> Result<PhoneSession, String> {
        if !(1024..=65535).contains(&port) {
            return Err("port must be between 1024 and 65535".to_owned());
        }
        {
            let mut inner = self.inner.lock();
            inner.enabled = true;
            inner.port = port;
            inner.code = Some(random_code());
            inner.code_deadline = Some(Instant::now() + PAIR_TTL);
            inner.token = None;
            inner.token_deadline = None;
        }
        if !self.running.swap(true, Ordering::SeqCst) {
            let existing = self.thread.lock().take();
            if let Some(handle) = existing {
                let _ = handle.join();
            }
            let agent = Arc::new(self.clone());
            let handle = thread::Builder::new()
                .name("vytrix-phone-agent".to_owned())
                .spawn(move || agent.serve(port))
                .map_err(|error| error.to_string())?;
            *self.thread.lock() = Some(handle);
        }
        Ok(self.session())
    }

    pub fn rotate_code(&self) -> PhoneSession {
        let mut inner = self.inner.lock();
        inner.code = Some(random_code());
        inner.code_deadline = Some(Instant::now() + PAIR_TTL);
        inner.token = None;
        inner.token_deadline = None;
        drop(inner);
        let _ = self.app.emit("vytrix://phone-disconnected", json!({ "reason": "code-rotated" }));
        self.session()
    }

    pub fn unpair(&self) -> PhoneSession {
        let mut inner = self.inner.lock();
        inner.token = None;
        inner.token_deadline = None;
        drop(inner);
        let _ = self.app.emit("vytrix://phone-disconnected", json!({ "reason": "unpaired" }));
        self.session()
    }

    pub fn set_permissions(&self, permissions: PhonePermissions) {
        self.inner.lock().permissions = permissions;
    }

    pub fn set_presets(&self, presets: Vec<PhonePreset>) {
        let bounded = presets.into_iter().take(200).collect::<Vec<_>>();
        self.inner.lock().presets = bounded;
    }

    pub fn stop(&self) -> PhoneSession {
        self.running.store(false, Ordering::SeqCst);
        self.wake();
        if let Some(handle) = self.thread.lock().take() {
            let _ = handle.join();
        }
        let mut inner = self.inner.lock();
        inner.enabled = false;
        inner.code = None;
        inner.code_deadline = None;
        inner.token = None;
        inner.token_deadline = None;
        drop(inner);
        let _ = self.app.emit("vytrix://phone-disconnected", json!({ "reason": "stopped" }));
        self.session()
    }

    fn wake(&self) {
        let port = self.inner.lock().port;
        if let Ok(mut stream) = TcpStream::connect(("127.0.0.1", port)) {
            let _ = stream.write_all(b"GET /__wake HTTP/1.1\r\nHost: 127.0.0.1\r\nConnection: close\r\n\r\n");
            let _ = stream.flush();
        }
    }

    fn serve(self: Arc<Self>, port: u16) {
        let server = match Server::http(("0.0.0.0", port)) {
            Ok(server) => server,
            Err(_) => {
                self.running.store(false, Ordering::SeqCst);
                return;
            }
        };
        let _ = self.app.emit("vytrix://phone-session", self.session());
        for request in server.incoming_requests() {
            if !self.running.load(Ordering::SeqCst) {
                break;
            }
            self.handle_request(request);
        }
    }

    fn handle_request(self: &Arc<Self>, mut request: tiny_http::Request) {
        let method = request.method().clone();
        let path = request.url().split('?').next().unwrap_or("").to_owned();

        if method == Method::Options {
            let _ = request.respond(empty_response(204));
            return;
        }

        let mut body = Vec::new();
        let _ = request.as_reader().take(MAX_BODY_BYTES as u64 + 1).read_to_end(&mut body);
        if body.len() > MAX_BODY_BYTES {
            let _ = request.respond(json_response(413, json!({ "error": "payload too large" })));
            return;
        }
        let payload: Value = if body.is_empty() {
            Value::Null
        } else {
            match serde_json::from_slice(&body) {
                Ok(value) => value,
                Err(_) => {
                    let _ = request.respond(json_response(400, json!({ "error": "invalid json" })));
                    return;
                }
            }
        };

        if method == Method::Post && path == "/pair" {
            let supplied = payload.get("code").and_then(Value::as_str).unwrap_or("");
            let mut inner = self.inner.lock();
            let valid = inner
                .code
                .as_deref()
                .is_some_and(|code| code == supplied)
                && inner.code_deadline.is_some_and(|deadline| deadline > Instant::now());
            if !valid {
                drop(inner);
                let _ = request.respond(json_response(401, json!({ "error": "invalid or expired pairing code" })));
                return;
            }
            let token = random_token();
            inner.token = Some(token.clone());
            inner.token_deadline = Some(Instant::now() + SESSION_TTL);
            inner.code = None;
            inner.code_deadline = None;
            let expires_at = deadline_millis(inner.token_deadline);
            drop(inner);
            let _ = self.app.emit("vytrix://phone-paired", json!({ "expiresAt": expires_at }));
            let _ = request.respond(json_response(200, json!({ "token": token, "expiresAt": expires_at })));
            return;
        }

        let authorized = {
            let mut inner = self.inner.lock();
            let bearer = request
                .headers()
                .iter()
                .find(|header| header.field.equiv("Authorization"))
                .and_then(|header| header.value.as_str().strip_prefix("Bearer "))
                .unwrap_or("");
            let matched = inner.token.as_deref().is_some_and(|token| token == bearer);
            let live = inner.token_deadline.is_some_and(|deadline| deadline > Instant::now());
            if matched && !live {
                inner.token = None;
                inner.token_deadline = None;
            }
            matched && live
        };
        if !authorized {
            let _ = request.respond(json_response(401, json!({ "error": "pairing required" })));
            return;
        }

        let response = match (method.clone(), path.as_str()) {
            (Method::Get, "/state") => {
                let inner = self.inner.lock();
                json_response(200, json!({
                    "deviceName": "VYTRIX",
                    "agentVersion": env!("CARGO_PKG_VERSION"),
                    "paired": true,
                    "expiresAt": deadline_millis(inner.token_deadline),
                    "color": inner.color,
                    "activePresetId": inner.preset_id,
                    "crosshairEnabled": inner.crosshair_enabled,
                    "presets": inner.presets,
                }))
            }
            (Method::Post, "/color") => {
                let settings = payload.get("settings").filter(|value| value.is_object()).unwrap_or(&payload);
                match parse_color(settings) {
                    Ok(incoming) => {
                        let mut inner = self.inner.lock();
                        let merged = merge_color(&inner.color, incoming, &inner.permissions);
                        inner.color = merged.clone();
                        drop(inner);
                        let _ = self.app.emit("vytrix://phone-color", merged.clone());
                        json_response(200, json!({ "ok": true, "color": merged }))
                    }
                    Err(error) => json_response(400, json!({ "error": error })),
                }
            }
            (Method::Post, "/preset") => {
                if !self.inner.lock().permissions.presets {
                    json_response(403, json!({ "error": "preset control is disabled" }))
                } else {
                    let id = payload.get("id").and_then(Value::as_str).unwrap_or("");
                    match crate::security::safe_id(id) {
                        Some(safe) => {
                            let mut inner = self.inner.lock();
                            inner.preset_id = Some(safe.clone());
                            drop(inner);
                            let _ = self.app.emit("vytrix://phone-preset", json!({ "id": safe }));
                            json_response(200, json!({ "ok": true, "id": safe }))
                        }
                        None => json_response(400, json!({ "error": "invalid preset id" })),
                    }
                }
            }
            (Method::Post, "/crosshair") => {
                if !self.inner.lock().permissions.crosshair {
                    json_response(403, json!({ "error": "crosshair control is disabled" }))
                } else {
                    match payload.get("enabled").and_then(Value::as_bool) {
                        Some(enabled) => {
                            let mut inner = self.inner.lock();
                            inner.crosshair_enabled = enabled;
                            drop(inner);
                            let _ = self.app.emit("vytrix://phone-crosshair", json!({ "enabled": enabled }));
                            json_response(200, json!({ "ok": true, "enabled": enabled }))
                        }
                        None => json_response(400, json!({ "error": "enabled must be a boolean" })),
                    }
                }
            }
            (Method::Post, "/unpair") => {
                let session = self.unpair();
                json_response(200, json!({ "ok": true, "expiresAt": session.expires_at }))
            }
            _ => json_response(404, json!({ "error": "not found" })),
        };
        let _ = request.respond(response);
    }
}

const CORS_ORIGIN: &[u8] = b"*";
const CORS_METHODS: &[u8] = b"GET, POST, OPTIONS";
const CORS_HEADERS: &[u8] = b"Content-Type, Authorization";

fn add_cors<R: Read>(response: &mut Response<R>) {
    let headers = [
        Header::from_bytes(&b"Access-Control-Allow-Origin"[..], CORS_ORIGIN),
        Header::from_bytes(&b"Access-Control-Allow-Methods"[..], CORS_METHODS),
        Header::from_bytes(&b"Access-Control-Allow-Headers"[..], CORS_HEADERS),
        Header::from_bytes(&b"Access-Control-Max-Age"[..], &b"600"[..]),
    ];
    for header in headers.into_iter().flatten() {
        response.add_header(header);
    }
}

fn json_response(status: u16, value: Value) -> Response<impl Read> {
    let mut response = Response::from_string(value.to_string()).with_status_code(status);
    if let Ok(header) = Header::from_bytes(&b"Content-Type"[..], &b"application/json"[..]) {
        response.add_header(header);
    }
    add_cors(&mut response);
    response
}

fn empty_response(status: u16) -> Response<impl Read> {
    let mut response = Response::empty(status);
    add_cors(&mut response);
    response
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn clamps_color_payload() {
        let value = json!({
            "saturation": 900.0,
            "gamma": -4.0,
            "hue": 42.0,
            "temperatureK": 99999.0
        });
        let color = parse_color(&value).expect("valid object");
        assert_eq!(color.saturation, 300.0);
        assert_eq!(color.gamma, 50.0);
        assert_eq!(color.hue, 42.0);
        assert_eq!(color.temperature_k, Some(12000.0));
        assert_eq!(color.vibrance, 100.0);
    }

    #[test]
    fn permissions_block_disabled_fields() {
        let current = ColorSettingsView::default();
        let incoming = ColorSettingsView {
            saturation: 250.0,
            gamma: 180.0,
            ..ColorSettingsView::default()
        };
        let mut permissions = PhonePermissions::default();
        permissions.gamma = false;
        let merged = merge_color(&current, incoming, &permissions);
        assert_eq!(merged.saturation, 250.0);
        assert_eq!(merged.gamma, 100.0);
    }

    #[test]
    fn rejects_non_object_payload() {
        assert!(parse_color(&json!([])).is_err());
    }

    #[test]
    fn rejects_non_finite_color() {
        let value = json!({ "saturation": null });
        let color = parse_color(&value).expect("null falls back to default");
        assert_eq!(color.saturation, 100.0);
    }
}
