(() => {
  const qrTarget = document.getElementById("qr-target");
  const urlInput = document.getElementById("qr-url");
  const generateBtn = document.getElementById("qr-generate");
  const downloadBtn = document.getElementById("qr-download");
  const copyBtn = document.getElementById("qr-copy");
  const deployedUrl =
    "https://hiibrarahmad.github.io/PRJ-2026-QRAR-0021-INRATACTIVE-PORFOLIO.GITHUB.IO/launch.html";
  const href = window.location.href || "";
  const baseFromHref = href.replace(/index\.html.*$/i, "");
  const origin = window.location.origin;
  const defaultUrl =
    origin && origin !== "null" && !/localhost|127\.0\.0\.1/i.test(origin)
      ? `${baseFromHref}launch.html`
      : deployedUrl;

  let qr;

  function buildQr(url) {
    qrTarget.innerHTML = "";
    qr = new QRCode(qrTarget, {
      text: url,
      width: 220,
      height: 220,
      colorDark: "#0b0f14",
      colorLight: "#e7eef7",
      correctLevel: QRCode.CorrectLevel.H,
    });
  }

  function getCanvas() {
    return qrTarget.querySelector("canvas") || qrTarget.querySelector("img");
  }

  function downloadQr() {
    const canvas = getCanvas();
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = "qr-ar-portfolio.png";
    link.href = canvas.toDataURL ? canvas.toDataURL("image/png") : canvas.src;
    link.click();
  }

  function copyUrl() {
    navigator.clipboard.writeText(urlInput.value || defaultUrl);
    copyBtn.textContent = "Copied";
    setTimeout(() => (copyBtn.textContent = "Copy Link"), 1200);
  }

  urlInput.value = defaultUrl;
  buildQr(defaultUrl);

  generateBtn.addEventListener("click", () => buildQr(urlInput.value || defaultUrl));
  downloadBtn.addEventListener("click", downloadQr);
  copyBtn.addEventListener("click", copyUrl);

  const repoGrid = document.getElementById("repo-grid");
  const repoStatus = document.getElementById("repo-status");
  const username = "hiibrarahmad";

  fetch(`https://api.github.com/users/${username}/repos?per_page=12&sort=updated`)
    .then((res) => res.json())
    .then((repos) => {
      if (!Array.isArray(repos)) throw new Error("GitHub API error");
      repoGrid.innerHTML = "";
      repos.slice(0, 8).forEach((repo) => {
        const card = document.createElement("div");
        card.className = "repo-card";
        card.innerHTML = `
          <a href="${repo.html_url}" target="_blank" rel="noreferrer">${repo.name}</a>
          <span>${repo.description || "No description"}</span>
          <span>? ${repo.stargazers_count} ? ${repo.language || "Mixed"}</span>
        `;
        repoGrid.appendChild(card);
      });
      repoStatus.textContent = "Live from GitHub";
    })
    .catch(() => {
      repoStatus.textContent = "Unable to load GitHub data right now.";
    });
})();
