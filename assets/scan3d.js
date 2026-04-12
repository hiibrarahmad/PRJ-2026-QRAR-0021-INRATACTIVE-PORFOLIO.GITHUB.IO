(() => {
  // Check if jsQR is available
  if (typeof jsQR === "undefined") {
    console.error("ERROR: jsQR library not loaded!");
    alert("QR detection library failed to load. Please refresh the page.");
    return;
  }
  
  console.log("✓ jsQR library loaded");

  const videoFeed = document.getElementById("camera-feed");
  const canvas = document.getElementById("qr-canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true });

  const topbar = document.getElementById("topbar");
  const controls = document.getElementById("controls");
  const statusEl = document.getElementById("status");
  const repoTitle = document.getElementById("repo-title");
  const repoMeta = document.getElementById("repo-meta");

  const opacitySlider = document.getElementById("opacity");
  const scaleSlider = document.getElementById("scale");
  const distanceSlider = document.getElementById("distance");
  const prevBtn = document.getElementById("prev");
  const nextBtn = document.getElementById("next");
  const rotateBtn = document.getElementById("rotate");
  const openBtn = document.getElementById("open");
  const zoomBtn = document.getElementById("zoom-in");
  const exitBtn = document.getElementById("exit");

  const targetHint = "PRJ-2026-QRAR-0021-INRATACTIVE-PORFOLIO.GITHUB.IO";
  const repos = [];
  let current = 0;
  let rotation = 0;
  let scale = 1;
  let qrDetected = false;
  let lastQrTime = 0;
  const qrTimeout = 1500; // Show UI for 1.5 seconds after QR leaves frame

  function showUI(show) {
    topbar.classList.toggle("hidden", !show);
    controls.classList.toggle("hidden", !show);
  }

  function updatePanel() {
    if (!repos.length) {
      repoTitle.textContent = "Loading portfolio...";
      repoMeta.textContent = "";
      return;
    }

    const repo = repos[current];
    repoTitle.textContent = repo.name;
    repoMeta.textContent = `⭐ ${repo.stargazers_count} · ${repo.language || "Mixed"} · ${new Date(repo.updated_at).toLocaleDateString()}`;
  }

  function applyUITransforms() {
    const opacity = opacitySlider.value;
    const scaleValue = scaleSlider.value;
    
    topbar.style.opacity = opacity;
    controls.style.opacity = opacity;
    topbar.style.transform = `scale(${scaleValue}) rotate(${rotation}deg)`;
    controls.style.transform = `scale(${scaleValue}) rotate(${rotation}deg)`;
  }

  opacitySlider.addEventListener("input", applyUITransforms);
  scaleSlider.addEventListener("input", applyUITransforms);
  distanceSlider.addEventListener("input", () => {}); // For future 3D distance control

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
    applyUITransforms();
  });

  zoomBtn.addEventListener("click", () => {
    const newScale = Math.min(scaleSlider.value + 0.2, 1.8);
    scaleSlider.value = newScale;
    applyUITransforms();
  });

  openBtn.addEventListener("click", () => {
    if (repos.length) {
      window.open(repos[current].html_url, "_blank");
    }
  });

  exitBtn.addEventListener("click", () => {
    if (videoFeed.srcObject) {
      videoFeed.srcObject.getTracks().forEach(track => track.stop());
    }
    window.location.href = "index.html";
  });

  async function startCamera() {
    try {
      console.log("Requesting camera access...");
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false,
      });
      
      console.log("Camera stream obtained:", stream.active);
      
      videoFeed.srcObject = stream;
      videoFeed.play().catch(err => console.error("Video play error:", err));
      
      // Wait for video to be ready
      await new Promise(resolve => {
        const onLoadedMetadata = () => {
          console.log("Video metadata loaded, dimensions:", videoFeed.videoWidth, "x", videoFeed.videoHeight);
          videoFeed.removeEventListener("loadedmetadata", onLoadedMetadata);
          resolve();
        };
        videoFeed.addEventListener("loadedmetadata", onLoadedMetadata);
        
        // Fallback timeout in case event doesn't fire
        setTimeout(() => {
          console.log("Video ready (timeout)");
          resolve();
        }, 2000);
      });
      
      console.log("Starting QR scan...");
      statusEl.innerHTML = "📷 <strong>Ready!</strong> Point camera at QR code";
      scanQrCodes();
    } catch (err) {
      console.error("Camera error:", err);
      statusEl.textContent = "❌ Camera access denied or not available";
      repoTitle.textContent = "Check browser permissions";
      showUI(true);
    }
  }

  function scanQrCodes() {
    try {
      if (videoFeed.readyState >= 2) {
        // Set canvas size to match video
        canvas.width = videoFeed.videoWidth || 1280;
        canvas.height = videoFeed.videoHeight || 720;
        
        if (canvas.width <= 0 || canvas.height <= 0) {
          console.warn("Canvas size invalid:", canvas.width, canvas.height);
          requestAnimationFrame(scanQrCodes);
          return;
        }

        // Draw video frame to canvas
        ctx.drawImage(videoFeed, 0, 0, canvas.width, canvas.height);
        
        // Get image data from canvas
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        // Run QR detection
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "attemptBoth",
        });

        const now = Date.now();

        // Detect ANY valid QR code (not just ones with specific marker text)
        if (code && code.data) {
          console.log("QR Code detected:", code.data);
          
          // Show portfolio when ANY QR is detected
          if (!qrDetected) {
            qrDetected = true;
            statusEl.innerHTML = "✅ <strong>QR Detected!</strong> Portfolio in view";
            showUI(true);
            console.log("Portfolio shown");
          }
          lastQrTime = now;
        } else {
          // Hide portfolio after timeout when no QR in view
          if (qrDetected && (now - lastQrTime) > qrTimeout) {
            qrDetected = false;
            statusEl.innerHTML = "📷 <strong>Point camera at QR code</strong>";
            showUI(false);
            console.log("Portfolio hidden - QR lost");
          }
        }
      }
    } catch (err) {
      console.error("QR scan error:", err);
    }
    requestAnimationFrame(scanQrCodes);
  }

  // Fetch GitHub repos
  fetch("https://api.github.com/users/hiibrarahmad/repos?per_page=12&sort=updated")
    .then((res) => res.json())
    .then((data) => {
      if (!Array.isArray(data)) {
        throw new Error("Invalid GitHub API response");
      }
      repos.length = 0;
      data.slice(0, 8).forEach((repo) => repos.push(repo));
      updatePanel();
      statusEl.innerHTML = "📷 <strong>Ready!</strong> Point camera at QR code";
    })
    .catch((err) => {
      console.error("GitHub API error:", err);
      statusEl.innerHTML = "⚠️ <strong>GitHub unavailable</strong>";
      repoTitle.textContent = "Check your connection";
      showUI(true);
    });

  // Initialize
  updatePanel();
  applyUITransforms();
  startCamera();
})();
