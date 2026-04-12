// Complete QR detection and portfolio system
function startApp() {
  // Get DOM elements
  const video = document.getElementById("camera-feed");
  const canvas = document.getElementById("qr-canvas");
  const debugLog = document.getElementById("debug-log");
  const statusEl = document.getElementById("status");
  const repoTitle = document.getElementById("repo-title");
  const repoMeta = document.getElementById("repo-meta");
  const topbar = document.getElementById("topbar");
  const controls = document.getElementById("controls");
  
  // Buttons
  const prevBtn = document.getElementById("prev");
  const nextBtn = document.getElementById("next");
  const openBtn = document.getElementById("open");
  const rotateBtn = document.getElementById("rotate");
  const exitBtn = document.getElementById("exit");
  const zoomBtn = document.getElementById("zoom-in");
  
  // Sliders
  const opacitySlider = document.getElementById("opacity");
  const scaleSlider = document.getElementById("scale");
  const distanceSlider = document.getElementById("distance");

  // Data
  const repos = [];
  let current = 0;
  let rotation = 0;
  let qrDetected = false;
  let lastQrTime = 0;
  let testMode = false;
  let testQrActive = false;

  // Debug logging
  function log(msg) {
    console.log(msg);
    if (debugLog) {
      debugLog.textContent += msg + "\n";
      debugLog.parentElement.scrollTop = debugLog.parentElement.scrollHeight;
    }
  }

  // Validation
  if (!video || !canvas) {
    log("❌ Missing video or canvas");
    return;
  }

  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    log("❌ Failed to get canvas context");
    return;
  }

  log("✓ Canvas ready");

  // Function to update portfolio display
  function updatePanel() {
    if (repos.length === 0) {
      if (repoTitle) repoTitle.textContent = "Loading repos...";
      if (repoMeta) repoMeta.textContent = "";
      return;
    }
    const repo = repos[current];
    if (repoTitle) repoTitle.textContent = repo.name;
    if (repoMeta) repoMeta.textContent = `⭐ ${repo.stargazers_count} · ${repo.language || "?"}`;
  }

  // Show/hide portfolio
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
    rotation = (rotation + 15) % 360;
    if (topbar) topbar.style.transform = `rotate(${rotation}deg)`;
    if (controls) controls.style.transform = `rotate(${rotation}deg)`;
  });

  if (opacitySlider) opacitySlider.addEventListener("input", (e) => {
    if (topbar) topbar.style.opacity = e.target.value;
    if (controls) controls.style.opacity = e.target.value;
  });

  if (scaleSlider) scaleSlider.addEventListener("input", (e) => {
    if (topbar) topbar.style.transform = `scale(${e.target.value})`;
    if (controls) controls.style.transform = `scale(${e.target.value})`;
  });

  if (distanceSlider) distanceSlider.addEventListener("input", (e) => {
    // Distance slider for future enhancement
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

  // Test mode button
  const testModeBtn = document.getElementById("test-mode-btn");
  if (testModeBtn) {
    testModeBtn.addEventListener("click", () => {
      testMode = !testMode;
      if (testMode) {
        log("🧪 TEST MODE ENABLED - Click to simulate QR detection");
        testModeBtn.style.background = "#f00";
        // Allow clicking anywhere to simulate QR
        document.addEventListener("click", simulateQRDetection);
      } else {
        log("🧪 Test mode disabled");
        testModeBtn.style.background = "#0f0";
        document.removeEventListener("click", simulateQRDetection);
      }
    });
  }

  function simulateQRDetection(e) {
    if (!testMode) return;
    if (e.target === testModeBtn) return; // Don't trigger on button
    
    testQrActive = !testQrActive;
    if (testQrActive) {
      log("✅ TEST: QR FOUND (simulated)");
      qrDetected = true;
      if (statusEl) statusEl.innerHTML = "✅ <b>QR Found!</b> Portfolio visible (TEST)";
      showPortfolio(true);
    } else {
      log("❌ TEST: QR Lost (simulated)");
      qrDetected = false;
      if (statusEl) statusEl.innerHTML = "📷 Point camera at QR code (TEST MODE)";
      showPortfolio(false);
    }
  }

  // Start camera
  async function startCamera() {
    try {
      log("📹 Requesting camera...");
      
      // Request lower resolution on mobile
      const constraints = {
        video: {
          facingMode: "environment",
          width: { ideal: 640 },
          height: { ideal: 480 }
        },
        audio: false,
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      log("✓ Camera stream received");

      video.srcObject = stream;
      video.setAttribute("playsinline", "");
      video.setAttribute("webkit-playsinline", "");
      video.setAttribute("autoplay", "");
      video.setAttribute("muted", "");

      // Ensure video can play
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(e => {
          log(`⚠️ Play error: ${e.message}`);
        });
      }

      // Wait for video to have data
      let metadata = false;
      const metadataHandler = () => {
        metadata = true;
        log(`✓ Video loaded: ${video.videoWidth}x${video.videoHeight}`);
        video.removeEventListener("loadedmetadata", metadataHandler);
      };
      
      video.addEventListener("loadedmetadata", metadataHandler);
      
      // Timeout fallback
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      if (!metadata) {
        log("⚠️ Metadata timeout - continuing");
      }

      log("▶️ Starting scan...");
      if (statusEl) statusEl.innerHTML = "📷 Point camera at QR code";
      
      // Wait for jsQR to be available
      let jsQRReady = false;
      if (typeof jsQR === "function") {
        jsQRReady = true;
        log("✓ jsQR available immediately");
      } else {
        log("⏳ Waiting for jsQR library...");
        // Poll for jsQR
        const waitForJsQR = setInterval(() => {
          if (typeof jsQR === "function") {
            clearInterval(waitForJsQR);
            jsQRReady = true;
            log("✓ jsQR loaded!");
          }
        }, 100);
        // Timeout after 5 seconds
        setTimeout(() => {
          if (!jsQRReady) {
            clearInterval(waitForJsQR);
            log("❌ jsQR failed to load from CDN!");
          }
        }, 5000);
      }
      
      scanFrame();
    } catch (err) {
      log(`❌ Camera fail: ${err.name || err.message}`);
      if (statusEl) statusEl.innerHTML = `❌ ${err.message}`;
    }
  }

  // Main scan loop
  let frameCount = 0;
  let lastLogTime = Date.now();
  let skipFrames = 0; // Skip every other frame for performance
  
  function scanFrame() {
    frameCount++;
    
    // Skip frames on mobile for performance
    skipFrames++;
    if (skipFrames % 2 !== 0) {
      requestAnimationFrame(scanFrame);
      return;
    }
    
    // Log every ~1 second
    if (Date.now() - lastLogTime > 1000) {
      log(`[SCAN] Frame ${frameCount}, video: ${video.videoWidth}x${video.videoHeight}, ready: ${video.readyState}`);
      lastLogTime = Date.now();
    }

    // Check video has data
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

    // Set canvas size
    canvas.width = w;
    canvas.height = h;

    // Draw video frame
    try {
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(video, 0, 0, w, h);
    } catch (e) {
      log(`❌ Draw error: ${e.message}`);
      requestAnimationFrame(scanFrame);
      return;
    }

    // Get pixel data
    let imageData;
    try {
      imageData = ctx.getImageData(0, 0, w, h);
    } catch (e) {
      log(`❌ ImageData error: ${e.message}`);
      requestAnimationFrame(scanFrame);
      return;
    }

    // Check jsQR is available
    if (typeof jsQR !== "function") {
      // jsQR not ready yet, skip this frame
      requestAnimationFrame(scanFrame);
      return;
    }

    // Run QR detection
    let code;
    try {
      code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "attemptBoth",
      });
    } catch (e) {
      log(`⚠️ jsQR processing error: ${e.message}`);
      requestAnimationFrame(scanFrame);
      return;
    }

    const now = Date.now();

    // Handle QR detection
    if (code && code.data) {
      log(`✅ QR FOUND: ${code.data.substring(0, 50)}`);
      
      if (!qrDetected) {
        qrDetected = true;
        if (statusEl) statusEl.innerHTML = "✅ <b>QR Found!</b> Portfolio visible";
        showPortfolio(true);
      }
      lastQrTime = now;
    } else {
      // Hide portfolio if QR lost
      if (qrDetected && (now - lastQrTime) > 1500) {
        qrDetected = false;
        if (statusEl) statusEl.innerHTML = "📷 Point camera at QR code";
        showPortfolio(false);
      }
    }

    requestAnimationFrame(scanFrame);
  }

  // Fetch repos from GitHub
  log("📡 Fetching repos...");
  fetch("https://api.github.com/users/hiibrarahmad/repos?per_page=12&sort=updated")
    .then(res => res.json())
    .then(data => {
      if (!Array.isArray(data)) throw new Error("Invalid response");
      log(`✓ Got ${data.length} repos`);
      repos.length = 0;
      data.slice(0, 8).forEach(r => repos.push(r));
      updatePanel();
      if (statusEl) statusEl.innerHTML = "✓ Ready! Open camera";
    })
    .catch(err => {
      log(`⚠️ GitHub error: ${err.message}`);
      if (statusEl) statusEl.innerHTML = "⚠️ GitHub data failed";
    });

  // Initialize
  updatePanel();
  startCamera();
}

// Start when ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", startApp);
} else {
  startApp();
}
