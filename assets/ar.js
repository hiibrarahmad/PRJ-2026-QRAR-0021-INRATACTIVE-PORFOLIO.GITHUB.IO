(() => {
  const mode = window.APP_MODE || "webxr";
  const repos = [];
  let current = 0;

  const panel = document.getElementById("panel");
  const panelBg = document.getElementById("panel-bg");
  const panelTitle = document.getElementById("panel-title");
  const panelDesc = document.getElementById("panel-desc");
  const panelMeta = document.getElementById("panel-meta");

  const repoTitle = document.getElementById("repo-title");
  const repoDesc = document.getElementById("repo-desc");
  const repoMeta = document.getElementById("repo-meta");

  const opacitySlider = document.getElementById("opacity");
  const scaleSlider = document.getElementById("scale");
  const prevBtn = document.getElementById("prev");
  const nextBtn = document.getElementById("next");
  const openBtn = document.getElementById("open");
  const enterBtn = document.getElementById("enter-ar");
  const statusEl = document.getElementById("status");

  function truncate(text, max) {
    if (!text) return "";
    return text.length > max ? `${text.slice(0, max - 1)}?` : text;
  }

  function updatePanel() {
    if (!repos.length) {
      panelTitle.setAttribute("value", "Loading portfolio?");
      panelDesc.setAttribute("value", "Fetching repositories from GitHub.");
      panelMeta.setAttribute("value", "");
      repoTitle.textContent = "Loading?";
      repoDesc.textContent = "";
      repoMeta.textContent = "";
      return;
    }

    const repo = repos[current];
    panelTitle.setAttribute("value", truncate(repo.name, 26));
    panelDesc.setAttribute("value", truncate(repo.description || "No description", 120));
    panelMeta.setAttribute("value", `? ${repo.stargazers_count} ? ${repo.language || "Mixed"}`);

    repoTitle.textContent = repo.name;
    repoDesc.textContent = repo.description || "No description";
    repoMeta.textContent = `Updated ${new Date(repo.updated_at).toLocaleDateString()}`;
  }

  function setOpacity(value) {
    panelBg.setAttribute("material", "opacity", value);
  }

  function setScale(value) {
    panel.object3D.scale.set(value, value, value);
  }

  function rotate(delta) {
    panel.object3D.rotation.y += delta;
  }

  opacitySlider.addEventListener("input", (e) => setOpacity(e.target.value));
  scaleSlider.addEventListener("input", (e) => setScale(e.target.value));
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

  document.getElementById("rotate-left").addEventListener("click", () => rotate(0.2));
  document.getElementById("rotate-right").addEventListener("click", () => rotate(-0.2));

  if (mode === "webxr") {
    const scene = document.querySelector("a-scene");
    enterBtn.addEventListener("click", () => {
      if (scene && scene.enterAR) {
        scene.enterAR();
      }
    });

    scene.addEventListener("enter-vr", () => {
      statusEl.textContent = "AR session active";
    });
    scene.addEventListener("exit-vr", () => {
      statusEl.textContent = "AR session ended";
    });
  } else {
    enterBtn.textContent = "Marker mode";
    enterBtn.disabled = true;
    const marker = document.querySelector("a-marker");
    const panelEntity = document.getElementById("panel");
    if (panelEntity) {
      panelEntity.setAttribute("visible", false);
    }
    if (marker) {
      marker.addEventListener("markerFound", () => {
        statusEl.textContent = "Marker detected";
        if (panelEntity) panelEntity.setAttribute("visible", true);
      });
      marker.addEventListener("markerLost", () => {
        statusEl.textContent = "Marker not in view";
        if (panelEntity) panelEntity.setAttribute("visible", false);
      });
    }
  }

  updatePanel();

  fetch("https://api.github.com/users/hiibrarahmad/repos?per_page=12&sort=updated")
    .then((res) => res.json())
    .then((data) => {
      if (!Array.isArray(data)) throw new Error("GitHub API error");
      data.slice(0, 8).forEach((repo) => repos.push(repo));
      updatePanel();
    })
    .catch(() => {
      statusEl.textContent = "Unable to load GitHub data right now.";
    });
})();
