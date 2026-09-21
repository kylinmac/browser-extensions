/* Force Dark — content script (document_start, all frames) */
(() => {
  "use strict";

  const STYLE_ID = "__force_dark_style__";
  const MEDIA_ATTR = "data-forcedark-media";

  const DEFAULTS = {
    enabled: true,          // 全局总开关
    mode: "auto",           // auto: 页面本身是深色则跳过 | force: 总是反转
    brightness: 100,        // %
    contrast: 100,          // %
    grayscale: 0,           // %
    sepia: 0,               // %
    sites: {}               // { "example.com": "on" | "off" | "force" }
  };

  const host = (location.hostname || "").replace(/^www\./, "");
  let settings = { ...DEFAULTS };
  let applied = false;
  let pageIsNativelyDark = null;

  /* ---------- 样式注入 ---------- */

  function buildCss(s) {
    const f = [
      "invert(100%)",
      "hue-rotate(180deg)",
      s.brightness !== 100 ? `brightness(${s.brightness}%)` : "",
      s.contrast !== 100 ? `contrast(${s.contrast}%)` : "",
      s.grayscale ? `grayscale(${s.grayscale}%)` : "",
      s.sepia ? `sepia(${s.sepia}%)` : ""
    ].filter(Boolean).join(" ");

    // 反向滤镜：让图片/视频等媒体保持原本颜色
    const un = "invert(100%) hue-rotate(180deg)";

    return `
:root {
  /* 根背景在 filter 内部绘制，会被一起反转，所以这里要给白色 */
  background-color: #ffffff !important;
  color-scheme: light !important;
  filter: ${f} !important;
}
img, picture, video, canvas, iframe, frame, embed, object,
svg image, [${MEDIA_ATTR}] {
  filter: ${un} !important;
}
/* 已被反转的元素内部的媒体不要二次反转 */
[${MEDIA_ATTR}] img, [${MEDIA_ATTR}] video, [${MEDIA_ATTR}] canvas {
  filter: none !important;
}
/* 滚动条由视口绘制，在 filter 之外，不会被反转，所以直接给深色 */
::-webkit-scrollbar { background-color: #202324; width: 12px; height: 12px; }
::-webkit-scrollbar-thumb { background-color: #4a4f52; border-radius: 6px; }
::-webkit-scrollbar-thumb:hover { background-color: #5e6467; }
::-webkit-scrollbar-corner { background-color: #202324; }
`;
  }

  function injectStyle(css) {
    const root = document.documentElement;
    if (!root) return;
    let el = document.getElementById(STYLE_ID);
    if (!el) {
      el = document.createElement("style");
      el.id = STYLE_ID;
      el.media = "screen";
      root.appendChild(el);
    }
    if (el.textContent !== css) el.textContent = css;
    // 保证样式始终在最后，避免被站点样式覆盖
    if (el.parentNode && el.parentNode.lastElementChild !== el) {
      el.parentNode.appendChild(el);
    }
  }

  function removeStyle() {
    const el = document.getElementById(STYLE_ID);
    if (el) el.remove();
  }

  /* ---------- 页面本身是否已是深色 ---------- */

  function luminance(rgb) {
    const m = rgb.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const p = m[1].split(",").map(v => parseFloat(v));
    if (p.length >= 4 && p[3] === 0) return null; // 完全透明
    const [r, g, b] = p;
    return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  }

  function detectNativeDark() {
    const body = document.body;
    const html = document.documentElement;
    let lum = null;
    for (const el of [body, html]) {
      if (!el) continue;
      const bg = getComputedStyle(el).backgroundColor;
      const l = luminance(bg);
      if (l !== null) { lum = l; break; }
    }
    if (lum === null) return false;      // 默认白底
    return lum < 0.35;
  }

  /* ---------- 背景图元素的反向处理 ---------- */

  const seen = new WeakSet();
  const pending = new Set();   // 待扫描的子树根
  let scanQueued = false;

  function hasOwnText(el) {
    for (const n of el.childNodes) {
      if (n.nodeType === Node.TEXT_NODE && n.nodeValue.trim()) return true;
    }
    return false;
  }

  function tag(el) {
    if (seen.has(el)) return false;
    seen.add(el);
    const bg = getComputedStyle(el).backgroundImage;
    if (!bg || bg === "none" || !bg.includes("url(")) return true;
    if (bg.includes("gradient")) return true;   // 渐变反转后更难看
    if (hasOwnText(el)) return true;            // 含文字的容器不反转
    el.setAttribute(MEDIA_ATTR, "");
    return true;
  }

  // 预算只花在真正需要计算样式的新元素上，已处理过的元素不消耗预算，
  // 否则大页面第一次扫完后预算就被占满，新内容永远轮不到。
  function scanBackgrounds(roots) {
    if (!applied) return;
    let budget = 3000;
    for (const root of roots) {
      if (budget <= 0) { pending.add(root); break; }
      if (root.nodeType !== Node.ELEMENT_NODE) continue;
      if (tag(root)) budget--;
      for (const el of root.querySelectorAll("*")) {
        if (budget <= 0) { pending.add(root); break; }
        if (tag(el)) budget--;
      }
    }
  }

  function queueScan() {
    if (scanQueued || !applied || !pending.size) return;
    scanQueued = true;
    const run = () => {
      scanQueued = false;
      const batch = [...pending];
      pending.clear();
      scanBackgrounds(batch);
      if (pending.size) queueScan();   // 预算用完，剩下的下一轮继续
    };
    if (window.requestIdleCallback) requestIdleCallback(run, { timeout: 1000 });
    else setTimeout(run, 250);
  }

  function queueRoot(node) {
    if (node && node.nodeType === Node.ELEMENT_NODE) pending.add(node);
  }

  let observer = null;
  function startObserver() {
    if (observer || !document.documentElement) return;
    observer = new MutationObserver(records => {
      for (const r of records) for (const n of r.addedNodes) queueRoot(n);
      queueScan();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }
  function stopObserver() {
    if (observer) { observer.disconnect(); observer = null; }
  }

  /* ---------- 决策与应用 ---------- */

  function siteMode() {
    const v = settings.sites && settings.sites[host];
    return v || null;    // "on" | "off" | "force" | null(跟随全局)
  }

  function shouldApply() {
    const per = siteMode();
    if (per === "off") return false;
    if (per === "force") return true;
    if (!settings.enabled && per !== "on") return false;
    // auto 模式下，页面本身已是深色就跳过
    const mode = settings.mode;
    if (mode === "force") return true;
    if (pageIsNativelyDark === null) return true; // 还没检测出来，先按深色处理，避免闪白
    return !pageIsNativelyDark;
  }

  function apply() {
    const on = shouldApply();
    if (on) {
      injectStyle(buildCss(settings));
      applied = true;
      startObserver();
      queueRoot(document.body);
      queueScan();
    } else {
      removeStyle();
      applied = false;
      stopObserver();
    }
  }

  /* ---------- 启动流程 ---------- */

  // document_start：先按“开”渲染，避免白屏闪烁，读到设置后再修正
  injectStyle(buildCss(DEFAULTS));
  applied = true;

  chrome.storage.local.get(DEFAULTS).then(s => {
    settings = { ...DEFAULTS, ...s };
    apply();
  }).catch(() => {});

  const onReady = () => {
    pageIsNativelyDark = detectNativeDark();
    apply();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", onReady, { once: true });
  } else {
    onReady();
  }
  window.addEventListener("load", () => { pageIsNativelyDark = detectNativeDark(); apply(); }, { once: true });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local") return;
    for (const [k, v] of Object.entries(changes)) settings[k] = v.newValue;
    apply();
  });

  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg && msg.type === "get-state") {
      sendResponse({
        host,
        applied,
        pageIsNativelyDark: !!pageIsNativelyDark,
        siteMode: siteMode()
      });
    }
    return false;
  });
})();
