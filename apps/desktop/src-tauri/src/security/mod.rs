//! Boundary validation for every payload crossing IPC.
//! Broken input produces no operation, never a partial one.

pub const MAX_TEXT: usize = 256;
pub const MAX_JSON_BYTES: usize = 262_144;
pub const MAX_ID: usize = 128;

pub fn safe_text(value: &str, max: usize) -> String {
    value
        .chars()
        .filter(|character| !character.is_control())
        .take(max.min(MAX_TEXT))
        .collect::<String>()
        .trim()
        .to_owned()
}

pub fn safe_id(value: &str) -> Option<String> {
    let cleaned = safe_text(value, MAX_ID);
    if cleaned.is_empty() { return None; }
    if !cleaned.chars().all(|c| c.is_ascii_alphanumeric() || c == '-' || c == '_' || c == '.') {
        return None;
    }
    Some(cleaned)
}

pub fn bounded_json(value: &serde_json::Value) -> Result<String, String> {
    let serialized = serde_json::to_string(value).map_err(|error| error.to_string())?;
    if serialized.len() > MAX_JSON_BYTES { return Err("payload too large".to_owned()); }
    Ok(serialized)
}

pub fn clamp(value: f64, min: f64, max: f64) -> f64 {
    if !value.is_finite() { return min; }
    value.clamp(min, max)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn strips_controls_and_bounds_length() {
        assert_eq!(safe_text("  hel\u{0000}lo\n ", 32), "hello");
        assert_eq!(safe_text("abcdef", 3), "abc");
    }

    #[test]
    fn rejects_unsafe_ids() {
        assert!(safe_id("good-id_1.2").is_some());
        assert!(safe_id("../escape").is_none());
        assert!(safe_id("a b").is_none());
        assert!(safe_id("").is_none());
    }

    #[test]
    fn rejects_oversized_json() {
        let value = serde_json::json!({ "data": "x".repeat(MAX_JSON_BYTES) });
        assert!(bounded_json(&value).is_err());
    }

    #[test]
    fn clamps_non_finite() {
        assert_eq!(clamp(f64::NAN, 0.0, 100.0), 0.0);
        assert_eq!(clamp(500.0, 0.0, 100.0), 100.0);
    }
}
