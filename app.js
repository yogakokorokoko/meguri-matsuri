const videos = window.MEGURI_VIDEOS || [];

const state = {
  series: "all",
  member: "all",
  query: "",
  sort: "member",
  selectedId: 0
};

const memberFilters = document.querySelector("#memberFilters");
const seriesFilters = document.querySelector("#seriesFilters");
const searchInput = document.querySelector("#searchInput");
const sortSelect = document.querySelector("#sortSelect");
const videoGrid = document.querySelector("#videoGrid");
const featuredVideo = document.querySelector("#featuredVideo");
const resultCount = document.querySelector("#resultCount");
const emptyState = document.querySelector("#emptyState");
const readyCount = document.querySelector("#readyCount");
const comingCount = document.querySelector("#comingCount");
const resetFilters = document.querySelector("#resetFilters");
const themeToggle = document.querySelector("#themeToggle");
const copyShare = document.querySelector("#copyShare");
const toast = document.querySelector("#toast");

function youtubeId(url) {
  if (!url) return "";
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtu.be")) return parsed.pathname.slice(1);
    if (parsed.searchParams.get("v")) return parsed.searchParams.get("v");
    const live = parsed.pathname.match(/\/live\/([^/]+)/);
    if (live) return live[1];
    const shorts = parsed.pathname.match(/\/shorts\/([^/]+)/);
    if (shorts) return shorts[1];
    const embed = parsed.pathname.match(/\/embed\/([^/]+)/);
    if (embed) return embed[1];
  } catch {
    return "";
  }
  return "";
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 2200);
}

function videoStatus(video) {
  return youtubeId(video.youtubeUrl) ? "\u8996\u8074\u3067\u304d\u307e\u3059" : "\u30ea\u30f3\u30af\u5f85\u3061";
}

function youtubeWatchUrl(video) {
  return video.id ? `https://www.youtube.com/watch?v=${video.id}` : video.youtubeUrl;
}

function decorate(video, index) {
  const id = youtubeId(video.youtubeUrl);
  return {
    ...video,
    id,
    index,
    ready: Boolean(id),
    memberNumber: Number(video.member)
  };
}

function filteredVideos() {
  const query = state.query.trim().toLowerCase();
  const filtered = videos.map(decorate).filter((video) => {
    const seriesMatch = state.series === "all" || video.series === state.series;
    const memberMatch = state.member === "all" || video.member === state.member;
    const queryText = `${video.title} ${video.name} ${video.member} ${video.note} ${video.series}`.toLowerCase();
    return seriesMatch && memberMatch && (!query || queryText.includes(query));
  });

  return filtered.sort((a, b) => {
    if (state.sort === "newest") return String(b.date).localeCompare(String(a.date));
    if (state.sort === "ready") return Number(b.ready) - Number(a.ready) || a.memberNumber - b.memberNumber;
    return a.memberNumber - b.memberNumber;
  });
}

function renderMemberFilters() {
  if (!memberFilters) return;
  const members = [...new Set(videos.map((video) => video.member))].sort((a, b) => Number(a) - Number(b));
  memberFilters.innerHTML = [
    `<button class="${state.member === "all" ? "active" : ""}" data-member="all">\u5168</button>`,
    ...members.map((member) => `<button class="${state.member === member ? "active" : ""}" data-member="${member}">${member}</button>`)
  ].join("");
}

function renderFeatured(video) {
  const selected = video || videos.map(decorate)[0];
  if (!selected) {
    featuredVideo.innerHTML = "";
    return;
  }

  const watchUrl = youtubeWatchUrl(selected);
  const player = selected.ready
    ? `
      <a class="player-preview" href="${escapeHtml(watchUrl)}" target="_blank" rel="noreferrer" aria-label="${escapeHtml(selected.title)}\u3092YouTube\u3067\u518d\u751f">
        <img src="https://img.youtube.com/vi/${selected.id}/hqdefault.jpg" alt="">
        <span class="player-shade"></span>
        <span class="player-play">YouTube\u3067\u518d\u751f</span>
      </a>
    `
    : `<div class="placeholder-art"><div><strong>${escapeHtml(selected.member)}</strong><span>${escapeHtml(selected.series)} / ${escapeHtml(selected.name)}</span></div></div>`;

  const watchLink = selected.ready
    ? `<a class="watch-link" href="${escapeHtml(watchUrl)}" target="_blank" rel="noreferrer">YouTube\u3067\u518d\u751f</a>`
    : `<a class="watch-link" aria-disabled="true">\u30ea\u30f3\u30af\u5f85\u3061</a>`;

  featuredVideo.innerHTML = `
    <div class="featured-inner">
      <div class="player">${player}</div>
      <div class="featured-info">
        <div class="meta-line">
          <span class="pill">${escapeHtml(selected.series)}</span>
          <span class="pill">Member ${escapeHtml(selected.member)}</span>
          <span class="pill ${selected.ready ? "ready" : "waiting"}">${videoStatus(selected)}</span>
        </div>
        <h2>${escapeHtml(selected.title)}</h2>
        <p>${escapeHtml(selected.note || "\u5de1\u308a\u796d\u306e\u30e9\u30a4\u30d6\u52d5\u753b\u3067\u3059\u3002")}</p>
        ${watchLink}
      </div>
    </div>
  `;
}

function renderCards(items) {
  videoGrid.innerHTML = items.map((video) => {
    const thumbnail = video.ready
      ? `<img src="https://img.youtube.com/vi/${video.id}/hqdefault.jpg" alt="">`
      : `<div class="thumb-fallback">${escapeHtml(video.member)}</div>`;

    return `
      <article class="video-card">
        <button class="thumb-button" data-index="${video.index}" aria-label="${escapeHtml(video.title)}\u3092\u9078\u629e">
          ${thumbnail}
          <span class="play-badge">${video.ready ? "\u518d\u751f" : "\u5f85\u3061"}</span>
        </button>
        <div class="card-body">
          <div class="meta-line">
            <span class="pill">${escapeHtml(video.series)}</span>
            <span class="pill">Member ${escapeHtml(video.member)}</span>
          </div>
          <h3>${escapeHtml(video.title)}</h3>
          <p>${escapeHtml(video.note)}</p>
        </div>
      </article>
    `;
  }).join("");
}

function renderStats() {
  const decorated = videos.map(decorate);
  readyCount.textContent = decorated.filter((video) => video.ready).length;
  comingCount.textContent = decorated.filter((video) => !video.ready).length;
}

function render() {
  renderMemberFilters();
  renderStats();

  const items = filteredVideos();
  const selected = items.find((video) => video.index === state.selectedId) || items[0] || videos.map(decorate)[0];
  if (selected) state.selectedId = selected.index;

  resultCount.textContent = `${items.length}\u4ef6`;
  emptyState.classList.toggle("show", items.length === 0);
  renderFeatured(selected);
  renderCards(items);
}

if (seriesFilters) {
  seriesFilters.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-series]");
    if (!button) return;
    state.series = button.dataset.series;
    [...seriesFilters.querySelectorAll("button")].forEach((item) => {
      item.classList.toggle("active", item === button);
    });
    render();
  });
}

if (memberFilters) {
  memberFilters.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-member]");
    if (!button) return;
    state.member = button.dataset.member;
    render();
  });
}

videoGrid.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-index]");
  if (!button) return;
  state.selectedId = Number(button.dataset.index);
  const selected = videos.map(decorate).find((video) => video.index === state.selectedId);
  renderFeatured(selected);
  featuredVideo.scrollIntoView({ behavior: "smooth", block: "start" });
});

if (searchInput) {
  searchInput.addEventListener("input", (event) => {
    state.query = event.target.value;
    render();
  });
}

if (sortSelect) {
  sortSelect.addEventListener("change", (event) => {
    state.sort = event.target.value;
    render();
  });
}

if (resetFilters) {
  resetFilters.addEventListener("click", () => {
    state.series = "all";
    state.member = "all";
    state.query = "";
    if (searchInput) searchInput.value = "";
    if (seriesFilters) {
      [...seriesFilters.querySelectorAll("button")].forEach((button) => {
        button.classList.toggle("active", button.dataset.series === "all");
      });
    }
    render();
  });
}

themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");
});

copyShare.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(location.href);
    showToast("\u30da\u30fc\u30b8\u30ea\u30f3\u30af\u3092\u30b3\u30d4\u30fc\u3057\u307e\u3057\u305f");
  } catch {
    showToast("\u30d6\u30e9\u30a6\u30b6\u306eURL\u3092\u5171\u6709\u3057\u3066\u304f\u3060\u3055\u3044");
  }
});

render();
