const DEFAULTS = {
  enabled: true, mode: "auto",
  brightness: 100, contrast: 100, grayscale: 0, sepia: 0,
  sites: {}
};
const SLIDERS = ["brightness", "contrast", "grayscale", "sepia"];
const $ = id => document.getElementById(id);
const t = k => chrome.i18n.getMessage(k) || k;

function localize() {
  for (const el of document.querySelectorAll("[data-i18n]")) {
    el.textContent = t(el.dataset.i18n);
  }
  for (const el of document.querySelectorAll("[data-i18n-title]")) {
    el.title = t(el.dataset.i18nTitle);
  }
  document.documentElement.lang = chrome.i18n.getUILanguage();
}

let state = { ...DEFAULTS };
let host = null;
let tabId = null;

function save(patch) {
  Object.assign(state, patch);
  chrome.storage.local.set(patch);
}

function renderSeg() {
  const cur = (host && state.sites[host]) || "default";
  for (const b of $("siteSeg").querySelectorAll("button")) {
    b.classList.toggle("active", b.dataset.v === cur);
  }
}

function renderSliders() {
  for (const k of SLIDERS) {
    $(k).value = state[k];
    $(k + "Val").textContent = state[k] + "%";
  }
  $("mode").value = state.mode;
  $("enabled").checked = state.enabled;
}

async function loadState() {
  state = { ...DEFAULTS, ...(await chrome.storage.local.get(DEFAULTS)) };
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  tabId = tab?.id ?? null;
  try { host = new URL(tab.url).hostname.replace(/^www\./, ""); } catch { host = null; }

  $("host").textContent = host || t("unsupported");
  if (!host) $("siteSeg").querySelectorAll("button").forEach(b => (b.disabled = true));

  renderSeg();
  renderSliders();

  if (tabId != null) {
    try {
      const s = await chrome.tabs.sendMessage(tabId, { type: "get-state" });
      $("hint").textContent = s.applied
        ? t("hintApplied")
        : (s.pageIsNativelyDark ? t("hintNativeDark") : t("hintOff"));
    } catch {
      $("hint").textContent = t("hintNoInject");
    }
  }
}

$("enabled").addEventListener("change", e => save({ enabled: e.target.checked }));
$("mode").addEventListener("change", e => save({ mode: e.target.value }));

for (const k of SLIDERS) {
  $(k).addEventListener("input", e => {
    const v = Number(e.target.value);
    $(k + "Val").textContent = v + "%";
    save({ [k]: v });
  });
}

$("siteSeg").addEventListener("click", e => {
  const b = e.target.closest("button");
  if (!b || !host) return;
  const sites = { ...state.sites };
  if (b.dataset.v === "default") delete sites[host];
  else sites[host] = b.dataset.v;
  save({ sites });
  renderSeg();
  setTimeout(loadState, 120);
});

$("reset").addEventListener("click", () => {
  const keep = state.sites;
  save({ ...DEFAULTS, sites: keep });
  renderSliders();
});

localize();
loadState();
