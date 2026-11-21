//! SQLite-backed local settings, profiles, presets and history.
//! The app stays fully usable with no account and no network.

use parking_lot::Mutex;
use rusqlite::{params, Connection};
use std::path::Path;

pub struct Storage {
    connection: Mutex<Connection>,
}

#[derive(serde::Serialize, serde::Deserialize, Clone)]
pub struct HistoryEntry {
    pub time: i64,
    pub text: String,
}

impl Storage {
    pub fn open(path: &Path) -> Result<Self, String> {
        let connection = Connection::open(path).map_err(|error| error.to_string())?;
        connection.execute_batch(
            "PRAGMA journal_mode=WAL;
             PRAGMA foreign_keys=ON;
             CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
             CREATE TABLE IF NOT EXISTS items (
                kind TEXT NOT NULL, id TEXT NOT NULL, json TEXT NOT NULL,
                PRIMARY KEY (kind, id)
             );
             CREATE TABLE IF NOT EXISTS history (
                id INTEGER PRIMARY KEY AUTOINCREMENT, time INTEGER NOT NULL, text TEXT NOT NULL
             );
             CREATE INDEX IF NOT EXISTS idx_items_kind ON items(kind);
             CREATE INDEX IF NOT EXISTS idx_history_time ON history(time DESC);",
        ).map_err(|error| error.to_string())?;
        Ok(Self { connection: Mutex::new(connection) })
    }

    pub fn get_setting(&self, key: &str) -> Option<String> {
        let guard = self.connection.lock();
        guard.query_row("SELECT value FROM settings WHERE key = ?1", params![key], |row| row.get(0)).ok()
    }

    pub fn set_setting(&self, key: &str, value: &str) -> Result<(), String> {
        let guard = self.connection.lock();
        guard.execute(
            "INSERT INTO settings (key, value) VALUES (?1, ?2) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
            params![key, value],
        ).map_err(|error| error.to_string())?;
        Ok(())
    }

    pub fn list(&self, kind: &str) -> Result<Vec<serde_json::Value>, String> {
        let guard = self.connection.lock();
        let mut statement = guard.prepare("SELECT json FROM items WHERE kind = ?1 ORDER BY id")
            .map_err(|error| error.to_string())?;
        let rows = statement.query_map(params![kind], |row| row.get::<_, String>(0))
            .map_err(|error| error.to_string())?;
        let mut output = Vec::new();
        for row in rows {
            let json = row.map_err(|error| error.to_string())?;
            if let Ok(value) = serde_json::from_str::<serde_json::Value>(&json) { output.push(value); }
        }
        Ok(output)
    }

    pub fn upsert(&self, kind: &str, id: &str, json: &str) -> Result<(), String> {
        let guard = self.connection.lock();
        guard.execute(
            "INSERT INTO items (kind, id, json) VALUES (?1, ?2, ?3)
             ON CONFLICT(kind, id) DO UPDATE SET json = excluded.json",
            params![kind, id, json],
        ).map_err(|error| error.to_string())?;
        Ok(())
    }

    pub fn delete(&self, kind: &str, id: &str) -> Result<(), String> {
        let guard = self.connection.lock();
        guard.execute("DELETE FROM items WHERE kind = ?1 AND id = ?2", params![kind, id])
            .map_err(|error| error.to_string())?;
        Ok(())
    }

    pub fn append_history(&self, text: &str) -> Result<(), String> {
        let guard = self.connection.lock();
        guard.execute(
            "INSERT INTO history (time, text) VALUES (?1, ?2)",
            params![chrono::Utc::now().timestamp_millis(), text],
        ).map_err(|error| error.to_string())?;
        let count: i64 = guard.query_row("SELECT COUNT(*) FROM history", [], |row| row.get(0))
            .map_err(|error| error.to_string())?;
        if count > 1000 {
            guard.execute(
                "DELETE FROM history WHERE id IN (SELECT id FROM history ORDER BY time ASC LIMIT ?1)",
                params![count - 1000],
            ).map_err(|error| error.to_string())?;
        }
        Ok(())
    }

    pub fn history(&self, limit: i64) -> Result<Vec<HistoryEntry>, String> {
        let guard = self.connection.lock();
        let mut statement = guard.prepare("SELECT time, text FROM history ORDER BY time DESC LIMIT ?1")
            .map_err(|error| error.to_string())?;
        let rows = statement.query_map(params![limit.min(1000).max(1)], |row| {
            Ok(HistoryEntry { time: row.get(0)?, text: row.get(1)? })
        }).map_err(|error| error.to_string())?;
        rows.collect::<Result<Vec<_>, _>>().map_err(|error| error.to_string())
    }

    pub fn export_backup(&self) -> Result<String, String> {
        let settings = self.list("setting-export")?;
        let profiles = self.list("game-profile")?;
        let presets = self.list("color-preset")?;
        let crosshairs = self.list("crosshair")?;
        let history = self.history(1000)?;
        serde_json::to_string_pretty(&serde_json::json!({
            "schemaVersion": 1,
            "product": "VYTRIX",
            "exportedAt": chrono::Utc::now().to_rfc3339(),
            "settings": settings,
            "profiles": profiles,
            "presets": presets,
            "crosshairs": crosshairs,
            "history": history,
        })).map_err(|error| error.to_string())
    }
}
