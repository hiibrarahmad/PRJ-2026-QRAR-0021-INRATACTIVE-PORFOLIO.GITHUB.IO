// Ensure DOM is ready, then start
function startApp() {
  // Core setup
  const video = document.getElementById("camera-feed");
  const canvas = document.getElementById("qr-canvas");
  
  if (!video || !canvas) {
    console.error("Required DOM elements missing");
    return;
  }
  
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    console.error("Failed to get canvas context");
    return;
  }

  // UI elements
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

  console.log("=== QR Portfolio Initialized ===");
  
  // Check jsQR is available
  if (typeof jsQR !== "function") {
    console.error("jsQR library not loaded");
    if (statusEl) statusEl.innerHTML = "❌ QR library failed to load";
    return;
  }
  console.log("✓ jsQR available");

  function updatePanel() {
    if (repos.length === 0) {
      repoTitle.textContent = "Loading repos...";
      repoMeta.textContent = "";
      return;
    }
    const repo = repos[current];
    repoTitle.textContent = repo.name;
    repoMeta.textContent = `⭐ ${repo.stargazers_count} · ${repo.language || "?"}`;
  }

  function showPortfolio(show) {
    topbar.classList.toggle("hidden", !show);
    controls.classList.toggle("hidden", !show);
  }

  // Event listeners
  prevBtn.addEventListener("click", () => {
    if (repos.length) {
      current = (current - 1 + repos.length) % repos.length;
      updatePanel();
    }
  });

  nextBtn.addEventListener("click", () => {
    if (repos.length) {
      current = (current + 1) % repos.length;
      updatePanel();
    }
  });

  rotateBtn.addEventListener("click", () => {
    rotation = (rotation + 15) % 360;
    topbar.style.transform = `rotate(${rotation}deg)`;
    controls.style.transform = `rotate(${rotation}deg)`;
  });

  opacitySlider.addEventListener("input", (e) => {
    topbar.style.opacity = e.target.value;
    controls.style.opacity = e.target.value;
  });

  scaleSlider.addEventListener("input", (e) => {
    topbar.style.transform = `scale(${e.target.value})`;
    controls.style.transform = `scale(${e.target.value})`;
  });

  distanceSlider.addEventListener("input", (e) => {
    // Distance slider can control z-position or other 3D properties if needed
    // For now, it's available for future enhancement
  });

  zoomBtn.addEventListener("click", () => {
    const newVal = Math.min(parseFloat(scaleSlider.value) + 0.2, 1.8);
    scaleSlider.value = newVal;
    scaleSlider.dispatchEvent(new Event("input"));
  });

  openBtn.addEventListener("click", () => {
    if (repos.length) window.open(repos[current].html_url, "_blank");
  });

  exitBtn.addEventListener("click", () => {
    window.location.href = "index.html";
  });

  // Camera and QR scanning
  async function startCamera() {
    try {
      console.log("Requesting camera access...");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      console.log("✓ Camera stream obtained");

      video.srcObject = stream;
      
      // Ensure video plays
      video.play().catch(e => console.error("Play error:", e));

      // Wait for metadata
      await new Promise((resolve) => {
        const onMetadata = () => {
          console.log(`✓ Video dimensions: ${video.videoWidth}×${video.videoHeight}`);
          video.removeEventListener("loadedmetadata", onMetadata);
          resolve();
        };
        video.addEventListener("loadedmetadata", onMetadata);
        setTimeout(resolve, 3000); // Fallback
      });

      console.log("Starting QR detection loop...");
      statusEl.innerHTML = "📷 Point camera at QR code";
      scanFrame();
    } catch (err) {
      console.error("Camera error:", err);
      statusEl.innerHTML = `❌ ${err.message}`;
    }
  }

  // Main scanning loop
  function scanFrame() {
    try {
      // Check video is playing
      if (video.readyState !== video.HAVE_ENOUGH_DATA) {
        requestAnimationFrame(scanFrame);
        return;
      }

      // Set canvas to video dimensions
      const w = video.videoWidth;
      const h = video.videoHeight;
      if (w <= 0 || h <= 0) {
        requestAnimationFrame(scanFrame);
        return;
      }

      canvas.width = w;
      canvas.height = h;

      // Draw video frame to canvas
      try {
        ctx.drawImage(video, 0, 0, w, h);
      } catch (e) {
        console.error("drawImage failed:", e);
        requestAnimationFrame(scanFrame);
        return;
      }

      // Get image data
      let imageData;
      try {
        imageData = ctx.getImageData(0, 0, w, h);
      } catch (e) {
        console.error("getImageData failed:", e);
        requestAnimationFrame(scanFrame);
        return;
      }

      // Scan for QR
      let code;
      try {
        code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "attemptBoth",
        });
      } catch (e) {
        console.error("jsQR error:", e);
        requestAnimationFrame(scanFrame);
        return;
      }

      const now = Date.now();

      if (code && code.data) {
        console.log("✓ QR detected:", code.data);
        
        if (!qrDetected) {
          qrDetected = true;
          statusEl.innerHTML = "✅ <b>QR Found!</b> Portfolio visible";
          showPortfolio(true);
          console.log("Portfolio shown");
        }
        lastQrTime = now;
      } else {
        if (qrDetected && (now - lastQrTime) > 1500) {
          qrDetected = false;
          statusEl.innerHTML = "📷 Point camera at QR code";
          showPortfolio(false);
          console.log("Portfolio hidden");
        }
      }
    } catch (err) {
      console.error("Scan error:", err);
    }

    requestAnimationFrame(scanFrame);
  }

  // Fetch repos
  console.log("Fetching GitHub repos...");
  fetch("https://api.github.com/users/hiibrarahmad/repos?per_page=12&sort=updated")
    .then((res) => res.json())
    .then((data) => {
      if (!Array.isArray(data)) throw new Error("Invalid response");
      console.log(`✓ Got ${data.length} repos`);
      repos.length = 0;
      data.slice(0, 8).forEach((r) => repos.push(r));
      updatePanel();
      statusEl.innerHTML = "✓ Ready! Now open camera";
    })
    .catch((err) => {
      console.error("GitHub error:", err);
      statusEl.innerHTML = "⚠️ GitHub data failed";
    });

  // Start everything
  updatePanel();
  startCamera();
}

// Start when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", startApp);
} else {
  startApp();
}
