//! Benchmark, bottleneck and network measurement. Never fabricates a number.

use super::*;
use std::net::{TcpStream, ToSocketAddrs};
use std::time::Duration;

pub fn start_benchmark(state: &PotatoState, game_id: &str, level: i32) -> Result<BenchmarkResult, String> {
    let safe = safe_id(game_id).ok_or_else(|| "invalid game identifier".to_owned())?;
    let hardware = state.hardware();
    let session = BenchmarkSession {
        id: format!("bench-{}", now_ms()),
        game_id: safe,
        level: level.clamp(0, 3),
        started: Instant::now(),
        started_at: now_ms(),
        samples: Vec::new(),
        hardware: hardware.clone(),
    };
    if let Ok(mut guard) = state.benchmark.lock() { *guard = Some(session); }
    Ok(empty_result(&hardware, game_id, level.clamp(0, 3)))
}

fn empty_result(hardware: &HardwareInfo, game_id: &str, level: i32) -> BenchmarkResult {
    BenchmarkResult {
        id: String::new(), game_id: game_id.to_owned(), level, started_at: 0, duration_ms: 0,
        sample_count: 0, measured_samples: 0, avg_fps: None, low_1_fps: None, avg_frame_ms: None,
        avg_gpu: None, avg_cpu: None, resolution: hardware.resolution.clone(),
        gpu_name: hardware.gpu_name.clone(), cpu_name: hardware.cpu_name.clone(),
        note: "benchmark running — no results until stopped".to_owned(),
    }
}

pub fn sample_benchmark(state: &PotatoState) -> Result<BenchmarkResult, String> {
    let (game_id, level, started_at, elapsed, len) = {
        let guard = state.benchmark.lock().map_err(|_| "benchmark lock unavailable".to_owned())?;
        let session = guard.as_ref().ok_or_else(|| "no benchmark is running".to_owned())?;
        (session.game_id.clone(), session.level, session.started_at,
         session.started.elapsed().as_millis() as i64, session.samples.len())
    };
    let mut result = empty_result(&state.hardware(), &game_id, level);
    result.started_at = started_at;
    result.duration_ms = elapsed;
    result.sample_count = len;
    Ok(result)
}

pub fn record_sample(state: &PotatoState) -> Result<(), String> {
    let metric = state.monitor.sample();
    let mut guard = state.benchmark.lock().map_err(|_| "benchmark lock unavailable".to_owned())?;
    let Some(session) = guard.as_mut() else { return Err("no benchmark is running".to_owned()); };
    if session.samples.len() >= MAX_BENCH_SAMPLES { return Err("sample limit reached".to_owned()); }
    session.samples.push(BenchmarkSample {
        timestamp: metric.timestamp,
        fps: metric.fps.filter(|v| v.is_finite() && *v > 0.0 && *v <= 1000.0),
        frame_time_ms: metric.frame_time_ms.filter(|v| v.is_finite() && *v > 0.0 && *v <= 1000.0),
        cpu: if metric.cpu.is_finite() { metric.cpu } else { 0.0 },
        gpu: metric.gpu.filter(|v| v.is_finite()),
        ram: if metric.ram.is_finite() { metric.ram } else { 0.0 },
        vram: metric.vram.filter(|v| v.is_finite()),
    });
    Ok(())
}

fn mean(values: &[f64]) -> Option<f64> {
    if values.is_empty() { None } else { Some(values.iter().sum::<f64>() / values.len() as f64) }
}

fn percentile_low(values: &[f64], fraction: f64) -> Option<f64> {
    if values.is_empty() { return None; }
    let mut sorted = values.to_vec();
    sorted.sort_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal));
    let index = ((sorted.len() as f64 * fraction).floor() as isize - 1).max(0) as usize;
    sorted.get(index.min(sorted.len() - 1)).copied()
}

pub fn stop_benchmark(state: &PotatoState) -> Result<BenchmarkResult, String> {
    let session = {
        let mut guard = state.benchmark.lock().map_err(|_| "benchmark lock unavailable".to_owned())?;
        guard.take().ok_or_else(|| "no benchmark is running".to_owned())?
    };
    let fps: Vec<f64> = session.samples.iter().filter_map(|s| s.fps).collect();
    let frames: Vec<f64> = session.samples.iter().filter_map(|s| s.frame_time_ms).collect();
    let gpu: Vec<f64> = session.samples.iter().filter_map(|s| s.gpu).collect();
    let cpu: Vec<f64> = session.samples.iter().map(|s| s.cpu).collect();
    let low_1 = if !frames.is_empty() {
        // Slowest 1% of frame times converted back to FPS.
        let mut sorted = frames.clone();
        sorted.sort_by(|a, b| b.partial_cmp(a).unwrap_or(std::cmp::Ordering::Equal));
        let count = ((sorted.len() as f64 * 0.01).ceil() as usize).max(1).min(sorted.len());
        mean(&sorted[..count]).filter(|v| *v > 0.0).map(|v| 1000.0 / v)
    } else {
        percentile_low(&fps, 0.01)
    };
    let result = BenchmarkResult {
        id: session.id, game_id: session.game_id, level: session.level, started_at: session.started_at,
        duration_ms: session.started.elapsed().as_millis() as i64,
        sample_count: session.samples.len(), measured_samples: fps.len().max(frames.len()),
        avg_fps: mean(&fps), low_1_fps: low_1, avg_frame_ms: mean(&frames),
        avg_gpu: mean(&gpu), avg_cpu: mean(&cpu),
        resolution: session.hardware.resolution, gpu_name: session.hardware.gpu_name,
        cpu_name: session.hardware.cpu_name,
        note: if fps.is_empty() && frames.is_empty() {
            "No FPS data was reported by the runtime. The game or capture tool must expose frame timing; nothing was estimated."
                .to_owned()
        } else {
            "Measured from native telemetry samples only. Different scenes, background load, server state and temperature affect comparisons."
                .to_owned()
        },
    };
    let path = state.root().join("benchmarks").join(format!("{}.json", safe_id(&result.id).unwrap_or_else(|| "bench".to_owned())));
    if let Ok(text) = serde_json::to_string_pretty(&result) { let _ = fs::write(path, text); }
    if let Ok(mut guard) = state.last_result.lock() { *guard = Some(result.clone()); }
    Ok(result)
}

pub fn last_benchmark(state: &PotatoState) -> Option<BenchmarkResult> {
    state.last_result.lock().ok().and_then(|g| g.clone())
}

pub fn benchmark_history(state: &PotatoState, limit: usize) -> Vec<BenchmarkResult> {
    let dir = state.root().join("benchmarks");
    let Ok(entries) = fs::read_dir(dir) else { return Vec::new(); };
    let mut out: Vec<BenchmarkResult> = entries.flatten()
        .filter_map(|entry| fs::read_to_string(entry.path()).ok())
        .filter_map(|text| serde_json::from_str::<BenchmarkResult>(&text).ok())
        .collect();
    out.sort_by_key(|r| std::cmp::Reverse(r.started_at));
    out.truncate(limit.min(50));
    out
}

// ---------------------------------------------------------------------------
// Bottleneck classification over a sampling window
// ---------------------------------------------------------------------------

pub fn classify(samples: &[BenchmarkSample]) -> BottleneckReport {
    let gpu = mean(&samples.iter().filter_map(|s| s.gpu).collect::<Vec<_>>());
    let cpu = mean(&samples.iter().map(|s| s.cpu).collect::<Vec<_>>());
    let vram = mean(&samples.iter().filter_map(|s| s.vram).collect::<Vec<_>>());
    let ram = mean(&samples.iter().map(|s| s.ram).collect::<Vec<_>>());
    let confidence = if samples.len() >= 60 { "moderate" }
        else if samples.len() >= 20 { "low" } else { "insufficient" };

    let (classification, explanation, advice) = if samples.len() < 20 {
        ("not determined".to_owned(),
         "Fewer than 20 samples were collected. A single utilization reading cannot identify a bottleneck.".to_owned(),
         "Collect a longer sample window with the game running at a consistent scene.".to_owned())
    } else if vram.map(|v| v >= 90.0).unwrap_or(false) {
        ("vram-limited".to_owned(),
         "Video memory usage stayed near its ceiling across the sampling window.".to_owned(),
         "Lowering texture quality may help; other reductions are less likely to matter.".to_owned())
    } else if ram.map(|v| v >= 90.0).unwrap_or(false) {
        ("memory-constrained".to_owned(),
         "System memory usage stayed near its ceiling across the sampling window.".to_owned(),
         "Closing background applications may help more than graphics simplification.".to_owned())
    } else if gpu.map(|v| v >= 85.0).unwrap_or(false) && cpu.map(|v| v < 70.0).unwrap_or(false) {
        ("gpu-limited".to_owned(),
         "GPU utilization was high while CPU utilization was comparatively low.".to_owned(),
         "Texture, shadow, reflection and post-processing reductions are the most relevant here.".to_owned())
    } else if cpu.map(|v| v >= 85.0).unwrap_or(false) && gpu.map(|v| v < 70.0).unwrap_or(false) {
        ("cpu-limited".to_owned(),
         "CPU utilization was high while GPU utilization was comparatively low.".to_owned(),
         "Potato Mode simplifies graphics; reducing texture detail alone is unlikely to resolve a CPU bottleneck. Test the game's CPU-intensive settings separately.".to_owned())
    } else {
        ("other-or-mixed".to_owned(),
         "Utilization did not separate cleanly into a GPU or CPU limit. Frame caps, server state, engine threading or vsync may dominate.".to_owned(),
         "Use a consistent scene and compare benchmark runs before drawing conclusions.".to_owned())
    };
    BottleneckReport { classification, confidence: confidence.to_owned(), sample_count: samples.len(),
        avg_gpu: gpu, avg_cpu: cpu, avg_vram: vram, avg_ram: ram, explanation, advice }
}

pub fn bottleneck_from_benchmark(state: &PotatoState) -> BottleneckReport {
    let samples = {
        let guard = state.benchmark.lock().ok();
        guard.as_ref().and_then(|g| g.as_ref()).map(|s| s.samples.clone()).unwrap_or_default()
    };
    classify(&samples)
}

pub fn sample_window(state: &PotatoState, seconds: u32, interval_ms: u64) -> BottleneckReport {
    let seconds = seconds.clamp(3, 30);
    let interval = Duration::from_millis(interval_ms.clamp(250, 5000));
    let deadline = Instant::now() + Duration::from_secs(seconds as u64);
    let mut samples = Vec::new();
    while Instant::now() < deadline && samples.len() < MAX_BENCH_SAMPLES {
        let metric = state.monitor.sample();
        samples.push(BenchmarkSample {
            timestamp: metric.timestamp,
            fps: metric.fps, frame_time_ms: metric.frame_time_ms,
            cpu: metric.cpu, gpu: metric.gpu, ram: metric.ram, vram: metric.vram,
        });
        std::thread::sleep(interval);
    }
    classify(&samples)
}

// ---------------------------------------------------------------------------
// Network latency probe — real TCP connect timing, no fabricated ping
// ---------------------------------------------------------------------------

fn valid_host(host: &str) -> bool {
    !host.is_empty() && host.len() <= 253 && host.chars().all(|c| {
        c.is_ascii_alphanumeric() || c == '.' || c == '-' || c == ':'
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    fn sample(gpu: Option<f64>, cpu: f64, vram: Option<f64>) -> BenchmarkSample {
        BenchmarkSample { timestamp: 0, fps: Some(60.0), frame_time_ms: Some(16.7),
            cpu, gpu, ram: 40.0, vram }
    }

    #[test]
    fn insufficient_samples_are_not_classified() {
        let report = classify(&[sample(Some(95.0), 20.0, Some(50.0))]);
        assert_eq!(report.classification, "not determined");
        assert_eq!(report.confidence, "insufficient");
    }

    #[test]
    fn high_gpu_low_cpu_is_gpu_limited() {
        let samples: Vec<_> = (0..30).map(|_| sample(Some(95.0), 30.0, Some(50.0))).collect();
        assert_eq!(classify(&samples).classification, "gpu-limited");
    }

    #[test]
    fn high_cpu_low_gpu_is_cpu_limited() {
        let samples: Vec<_> = (0..30).map(|_| sample(Some(30.0), 95.0, Some(50.0))).collect();
        assert_eq!(classify(&samples).classification, "cpu-limited");
    }

    #[test]
    fn high_vram_is_vram_limited() {
        let samples: Vec<_> = (0..30).map(|_| sample(Some(70.0), 60.0, Some(95.0))).collect();
        assert_eq!(classify(&samples).classification, "vram-limited");
    }

    #[test]
    fn net_probe_rejects_invalid_hosts() {
        assert!(net_probe("", 443, 1).is_err());
        assert!(net_probe("bad host!", 443, 1).is_err());
        assert!(net_probe("example.com", 0, 1).is_err());
    }
}

pub fn net_probe(host: &str, port: u16, count: u32) -> Result<NetProbeResult, String> {
    if !valid_host(host) { return Err("host contains unsupported characters".to_owned()); }
    if port == 0 { return Err("port must be 1-65535".to_owned()); }
    let count = count.clamp(1, 8);
    let target = format!("{host}:{port}");
    let mut rtts = Vec::new();
    let mut failures = 0usize;
    for _ in 0..count {
        let resolved = target.to_socket_addrs().map_err(|e| format!("host resolution failed: {e}"))?.next();
        let Some(addr) = resolved else { failures += 1; continue; };
        let started = Instant::now();
        match TcpStream::connect_timeout(&addr, Duration::from_secs(2)) {
            Ok(_) => rtts.push(started.elapsed().as_secs_f64() * 1000.0),
            Err(_) => failures += 1,
        }
    }
    Ok(NetProbeResult {
        host: host.to_owned(), port, samples: rtts.len(),
        min_ms: rtts.iter().copied().fold(f64::INFINITY, f64::min).is_finite()
            .then(|| rtts.iter().copied().fold(f64::INFINITY, f64::min)),
        avg_ms: mean(&rtts),
        max_ms: rtts.iter().copied().fold(f64::NEG_INFINITY, f64::max).is_finite()
            .then(|| rtts.iter().copied().fold(f64::NEG_INFINITY, f64::max)),
        loss_percent: (failures as f64 / count as f64) * 100.0,
        note: "Measures TCP handshake round-trip time, not ICMP ping. Game server queue time and routing are not included.".to_owned(),
    })
}
