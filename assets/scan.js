(() => {
  const video = document.getElementById("camera");
  const canvas = document.getElementById("qr-canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true });

  const permissionEl = document.getElementById("permission");
  const enableBtn = document.getElementById("enable-camera");

  const topbar = document.getElementById("topbar");
  const controls = document.getElementById("controls");
  const statusEl = document.getElementById("status");
  const repoTitle = document.getElementById("repo-title");
  const repoDesc = document.getElementById("repo-desc");
  const repoMeta = document.getElementById("repo-meta");

  const opacitySlider = document.getElementById("opacity");
  const scaleSlider = document.getElementById("scale");
  const prevBtn = document.getElementById("prev");
  const nextBtn = document.getElementById("next");
  const openBtn = document.getElementById("open");
  const rotateLeft = document.getElementById("rotate-left");
  const rotateRight = document.getElementById("rotate-right");

  const targetHint = "PRJ-2026-QRAR-0021-INRATACTIVE-PORFOLIO.GITHUB.IO";
  const repos = [];
  let current = 0;
  let rotation = 0;

  function showPanels(show) {
    topbar.classList.toggle("hidden", !show);
    controls.classList.toggle("hidden", !show);
  }

  function updatePanel() {
    if (!repos.length) {
      repoTitle.textContent = "Loading?";
      repoDesc.textContent = "Fetching repositories.";
      repoMeta.textContent = "";
      return;
    }
    const repo = repos[current];
    repoTitle.textContent = repo.name;
    repoDesc.textContent = repo.description || "No description";
    repoMeta.textContent = `? ${repo.stargazers_count} ? ${repo.language || "Mixed"}`;
  }

  function applyStyle() {
    const opacity = opacitySlider.value;
    const scale = scaleSlider.value;
    topbar.style.opacity = opacity;
    controls.style.opacity = opacity;
    topbar.style.transform = `scale(${scale}) rotate(${rotation}deg)`;
    controls.style.transform = `scale(${scale}) rotate(${rotation}deg)`;
  }

  opacitySlider.addEventListener("input", applyStyle);
  scaleSlider.addEventListener("input", applyStyle);
  rotateLeft.addEventListener("click", () => {
    rotation += 3;
    applyStyle();
  });
  rotateRight.addEventListener("click", () => {
    rotation -= 3;
    applyStyle();
  });

  prevBtn.addEventListener("click", () => {
    current = (current - 1 + repos.length) % repos.length;
    updatePanel();
  });
  nextBtn.addEventListener("click", () => {
    current = (current + 1) % repos.length;
    updatePanel();
  });
  openBtn.addEventListener("click", () => {
    if (!repos.length) return;
    window.open(repos[current].html_url, "_blank");
  });

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      video.srcObject = stream;
      await video.play();
      permissionEl.style.display = "none";
      tick();
    } catch (err) {
      permissionEl.querySelector("p").textContent =
        "Camera permission blocked. Please allow camera access and reload.";
    }
  }

  enableBtn.addEventListener("click", startCamera);

  function tick() {
    if (video.readyState >= 2) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "attemptBoth",
      });
      if (code && code.data && code.data.includes(targetHint)) {
        statusEl.textContent = "QR detected";
        showPanels(true);
      } else {
        statusEl.textContent = "QR not in view";
        showPanels(false);
      }
    }
    requestAnimationFrame(tick);
  }

  fetch("https://api.github.com/users/hiibrarahmad/repos?per_page=12&sort=updated")
    .then((res) => res.json())
    .then((data) => {
      if (!Array.isArray(data)) throw new Error("GitHub API error");
      data.slice(0, 8).forEach((repo) => repos.push(repo));
      updatePanel();
    })
    .catch(() => {
      repoTitle.textContent = "Portfolio unavailable";
      repoDesc.textContent = "GitHub data could not be loaded.";
    });

  applyStyle();
})();
