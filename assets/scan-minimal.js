// Ultra-robust QR detection with aggressive diagnostics
function startApp() {
  const video = document.getElementById("camera-feed");
  const canvas = document.getElementById("qr-canvas");
  const debugLog = document.getElementById("debug-log");
  const statusEl = document.getElementById("status");
  const topbar = document.getElementById("topbar");
  const controls = document.getElementById("controls");
  
  // Aggressive logging
  const logs = [];
  function log(msg) {
    const entry = `[${new Date().toLocaleTimeString()}] ${msg}`;
    console.log(entry);
    logs.push(entry);
    if (debugLog) {
      debugLog.textContent = logs.slice(-30).join("\n");
      debugLog.parentElement.scrollTop = debugLog.parentElement.scrollHeight;
    }
  }

  log("=== INIT START ===");
  
  if (!video || !canvas) {
    log("❌ CRITICAL: Missing video/canvas elements");
    return;
  }
  log("✓ Video & canvas found");

  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    log("❌ CRITICAL: Canvas context failed");
    return;
  }
  log("✓ Canvas context ready");

  // Check for jsQR now and later
  let jsQRLoadTime = null;
  if (typeof jsQR === "function") {
    jsQRLoadTime = Date.now();
    log(`✓ jsQR already loaded`);
  } else {
    log("⏳ jsQR not yet loaded - will poll");
  }

  // Get all UI elements
  const repoTitle = document.getElementById("repo-title");
  const repoMeta = document.getElementById("repo-meta");
  const prevBtn = document.getElementById("prev");
  const nextBtn = document.getElementById("next");
  const openBtn = document.getElementById("open");
  const rotateBtn = document.getElementById("rotate");
  const exitBtn = document.getElementById("exit");
  const zoomBtn = document.getElementById("zoom-in");
  const opacitySlider = document.getElementById("opacity");
  const scaleSlider = document.getElementById("scale");
  const distanceSlider = document.getElementById("distance");
  const testModeBtn = document.getElementById("test-mode-btn");

  const repos = [];
  let current = 0;
  let qrDetected = false;
  let testMode = false;
  let testQrActive = false;
  let cameraOpen = false;
  let scanStarted = false;

  function updatePanel() {
    if (repos.length === 0) {
      if (repoTitle) repoTitle.textContent = "Loading...";
      if (repoMeta) repoMeta.textContent = "";
      return;
    }
    const repo = repos[current];
    if (repoTitle) repoTitle.textContent = repo.name;
    if (repoMeta) repoMeta.textContent = `⭐ ${repo.stargazers_count} · ${repo.language || "?"}`;
  }

  function showPortfolio(show) {
    if (topbar) topbar.classList.toggle("hidden", !show);
    if (controls) controls.classList.toggle("hidden", !show);
  }

  // Event listeners
  if (prevBtn) prevBtn.addEventListener("click", () => {
    if (repos.length) {
      current = (current - 1 + repos.length) % repos.length;
      updatePanel();
    }
  });

  if (nextBtn) nextBtn.addEventListener("click", () => {
    if (repos.length) {
      current = (current + 1) % repos.length;
      updatePanel();
    }
  });

  if (rotateBtn) rotateBtn.addEventListener("click", () => {
    if (topbar) topbar.style.transform = `rotate(${Math.random() * 360}deg)`;
  });

  if (opacitySlider) opacitySlider.addEventListener("input", (e) => {
    if (topbar) topbar.style.opacity = e.target.value;
    if (controls) controls.style.opacity = e.target.value;
  });

  if (scaleSlider) scaleSlider.addEventListener("input", (e) => {
    if (topbar) topbar.style.transform = `scale(${e.target.value})`;
    if (controls) controls.style.transform = `scale(${e.target.value})`;
  });

  if (zoomBtn) zoomBtn.addEventListener("click", () => {
    if (scaleSlider) {
      const newVal = Math.min(parseFloat(scaleSlider.value) + 0.2, 1.8);
      scaleSlider.value = newVal;
      scaleSlider.dispatchEvent(new Event("input"));
    }
  });

  if (openBtn) openBtn.addEventListener("click", () => {
    if (repos.length) window.open(repos[current].html_url, "_blank");
  });

  if (exitBtn) exitBtn.addEventListener("click", () => {
    window.location.href = "index.html";
  });

  // Test mode
  if (testModeBtn) {
    testModeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      testMode = !testMode;
      if (testMode) {
        log("🧪 TEST MODE ON - click page to toggle QR");
        testModeBtn.style.background = "#f00";
        testModeBtn.textContent = "TEST ON";
        document.body.addEventListener("click", toggleQR);
      } else {
        log("🧪 TEST MODE OFF");
        testModeBtn.style.background = "#0f0";
        testModeBtn.textContent = "TEST";
        document.body.removeEventListener("click", toggleQR);
        if (testQrActive) {
          testQrActive = false;
          qrDetected = false;
          showPortfolio(false);
        }
      }
    });
  }

  function toggleQR(e) {
    if (!testMode || e.target.id === "test-mode-btn") return;
    testQrActive = !testQrActive;
    if (testQrActive) {
      log("✅ TEST: Portfolio ON");
      qrDetected = true;
      if (statusEl) statusEl.innerHTML = "✅ TEST: Portfolio visible";
      showPortfolio(true);
    } else {
      log("❌ TEST: Portfolio OFF");
      qrDetected = false;
      if (statusEl) statusEl.innerHTML = "📷 Point camera...";
      showPortfolio(false);
    }
  }

  // Start camera
  async function startCamera() {
    try {
      log("📹 Requesting camera...");
      const constraints = {
        video: {
          facingMode: "environment",
          width: { ideal: 480 },
          height: { ideal: 360 }
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      log("✓ Camera stream obtained");
      cameraOpen = true;

      video.srcObject = stream;
      video.setAttribute("playsinline", "");
      video.setAttribute("webkit-playsinline", "");
      video.setAttribute("autoplay", "");
      video.setAttribute("muted", "");

      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(e => {
          log(`⚠️ Video play failed: ${e.message}`);
        });
      }

      // Wait for metadata
      let gotMetadata = false;
      const metadataHandler = () => {
        gotMetadata = true;
        log(`✓ Video: ${video.videoWidth}x${video.videoHeight}`);
      };

      video.addEventListener("loadedmetadata", metadataHandler);
      await new Promise(r => setTimeout(r, 2000));

      if (!gotMetadata) {
        log("⚠️ No metadata yet - continuing anyway");
      }

      log("▶️ STARTING SCAN");
      if (statusEl) statusEl.innerHTML = "📷 Point camera...";
      scanStarted = true;
      scanFrame();
    } catch (err) {
      log(`❌ CAMERA ERROR: ${err.name}: ${err.message}`);
      if (statusEl) statusEl.innerHTML = `❌ ${err.message}`;
    }
  }

  // Scan loop
  let frameCount = 0;
  let detectionCount = 0;
  let lastLogTime = Date.now();
  let jsQRCheckCount = 0;

  function scanFrame() {
    frameCount++;

    // Log every 2 seconds
    if (Date.now() - lastLogTime > 2000) {
      const rate = ((frameCount / (Date.now() - lastLogTime)) * 1000).toFixed(1);
      const msg = `[FRAME ${frameCount}] video: ${video.videoWidth}x${video.videoHeight}, ready: ${video.readyState}, jsQR: ${typeof jsQR === "function" ? "YES" : "NO"}`;
      log(msg);
      lastLogTime = Date.now();
    }

    // Check jsQR
    if (typeof jsQR !== "function") {
      jsQRCheckCount++;
      if (jsQRCheckCount % 100 === 0) {
        log(`⏳ jsQR still loading... (checked ${jsQRCheckCount} times)`);
      }
      requestAnimationFrame(scanFrame);
      return;
    }

    if (!jsQRLoadTime) {
      jsQRLoadTime = Date.now();
      log(`✓ jsQR loaded after ${jsQRLoadTime}ms`);
    }

    if (video.readyState !== video.HAVE_ENOUGH_DATA) {
      requestAnimationFrame(scanFrame);
      return;
    }

    const w = video.videoWidth;
    const h = video.videoHeight;

    if (w <= 0 || h <= 0) {
      requestAnimationFrame(scanFrame);
      return;
    }

    canvas.width = w;
    canvas.height = h;

    try {
      ctx.drawImage(video, 0, 0, w, h);
    } catch (e) {
      log(`⚠️ Draw error: ${e.message}`);
      requestAnimationFrame(scanFrame);
      return;
    }

    let imageData;
    try {
      imageData = ctx.getImageData(0, 0, w, h);
    } catch (e) {
      log(`⚠️ GetImageData blocked: ${e.message}`);
      requestAnimationFrame(scanFrame);
      return;
    }

    let code;
    try {
      code = jsQR(imageData.data, w, h, { inversionAttempts: "attemptBoth" });
    } catch (e) {
      log(`⚠️ jsQR error: ${e.message}`);
      requestAnimationFrame(scanFrame);
      return;
    }

    if (code && code.data) {
      detectionCount++;
      log(`✅ QR #${detectionCount}: ${code.data.substring(0, 40)}`);
      if (!qrDetected) {
        qrDetected = true;
        if (statusEl) statusEl.innerHTML = "✅ QR Found!";
        showPortfolio(true);
      }
    } else {
      if (qrDetected && frameCount % 15 === 0) {
        qrDetected = false;
        if (statusEl) statusEl.innerHTML = "📷 Point camera...";
        showPortfolio(false);
      }
    }

    requestAnimationFrame(scanFrame);
  }

  // Fetch repos
  log("📡 Fetching repos...");
  fetch("https://api.github.com/users/hiibrarahmad/repos?per_page=12&sort=updated")
    .then(r => r.json())
    .then(data => {
      if (Array.isArray(data)) {
        log(`✓ ${data.length} repos fetched`);
        data.slice(0, 8).forEach(r => repos.push(r));
        updatePanel();
      } else {
        log(`⚠️ GitHub: Invalid response`);
      }
    })
    .catch(e => log(`⚠️ GitHub error: ${e.message}`));

  // Initialize
  log("Starting camera...");
  updatePanel();
  startCamera();
}

// Start
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", startApp);
} else {
  startApp();
}
