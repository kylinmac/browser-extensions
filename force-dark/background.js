/* Force Dark — service worker */
const DEFAULTS = {
  enabled: true,
  mode: "auto",
  brightness: 100,
  contrast: 100,
  grayscale: 0,
  sepia: 0,
  sites: {}
};

chrome.runtime.onInstalled.addListener(async () => {
  const cur = await chrome.storage.local.get(null);
  const next = {};
  for (const [k, v] of Object.entries(DEFAULTS)) {
    if (cur[k] === undefined) next[k] = v;
  }
  if (Object.keys(next).length) await chrome.storage.local.set(next);
});

function hostOf(url) {
  try { return new URL(url).hostname.replace(/^www\./, ""); }
  catch { return null; }
}

async function toggleSite(tab) {
  const host = hostOf(tab?.url || "");
  if (!host) return;
  const { sites = {}, enabled = true } = await chrome.storage.local.get(["sites", "enabled"]);
  const cur = sites[host];
  // 当前实际是开还是关
  const isOn = cur === "off" ? false : (cur ? true : enabled);
  sites[host] = isOn ? "off" : "on";
  await chrome.storage.local.set({ sites });
  updateBadge(tab.id);
}

chrome.commands.onCommand.addListener(async (cmd) => {
  if (cmd !== "toggle-site") return;
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab) toggleSite(tab);
});

async function updateBadge(tabId) {
  try {
    const state = await chrome.tabs.sendMessage(tabId, { type: "get-state" });
    const on = !!state?.applied;
    await chrome.action.setBadgeText({ tabId, text: on ? "" : "off" });
    await chrome.action.setBadgeBackgroundColor({ tabId, color: "#6b7280" });
  } catch {
    /* 内容脚本未注入的页面（chrome:// 等）忽略 */
  }
}

chrome.tabs.onUpdated.addListener((tabId, info) => {
  if (info.status === "complete") updateBadge(tabId);
});
chrome.tabs.onActivated.addListener(({ tabId }) => updateBadge(tabId));
chrome.storage.onChanged.addListener(async (_c, area) => {
  if (area !== "local") return;
  const tabs = await chrome.tabs.query({ active: true });
  for (const t of tabs) if (t.id != null) updateBadge(t.id);
});
