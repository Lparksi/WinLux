use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum ThemeMode {
    Light,
    Dark,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct ThemeState {
    pub apps: ThemeMode,
    pub system: ThemeMode,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LanguageSettings {
    pub preference: String,
    pub resolved: String,
    pub available: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GeocodeResult {
    pub address: String,
    pub display_name: String,
    pub latitude: f64,
    pub longitude: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SunTimesResult {
    pub address: String,
    pub display_name: String,
    pub latitude: f64,
    pub longitude: f64,
    pub date: String,
    pub sunrise_utc: String,
    pub sunset_utc: String,
    pub sunrise_local: String,
    pub sunset_local: String,
    pub sunrise_unix: i64,
    pub sunset_unix: i64,
    pub day_length_seconds: i64,
    pub day_length_hms: String,
    pub is_daylight: bool,
    pub recommended_theme: ThemeMode,
    pub next_transition: String,
    pub next_transition_local: String,
    pub next_transition_utc: String,
    pub seconds_until_next_transition: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SolarSettings {
    pub location: Option<GeocodeResult>,
    pub auto_theme_enabled: bool,
}
