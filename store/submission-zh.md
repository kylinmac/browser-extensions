# Edge 加载项提交表单 — 可直接复制的内容

## Properties · Category
建议选：**Productivity**（或 Accessibility / 辅助功能）

## Privacy · Single Purpose Description（单一用途）
This extension has one purpose: to render any web page in a dark color scheme.
It injects a CSS filter (invert + hue-rotate) into the page so that light-colored
sites become dark, regardless of whether the site provides its own dark theme.
It does not modify page content, inject ads, or alter any other page behavior.

中文版（若填中文市场）：
本扩展只做一件事：把网页显示为深色。通过向页面注入 CSS 滤镜（反色 + 色相旋转）
把浅色网站变为深色，无论该网站自身是否提供深色主题。不修改页面内容、不插入广告、
不改变页面的其他任何行为。

## Privacy · Permission justification（逐条权限说明）

**storage**
Stores the user's own preferences locally (global on/off switch, per-site
on/off/force setting, brightness / contrast / grayscale / sepia sliders).
Uses chrome.storage.local only. Nothing is ever transmitted off the device.

**host_permissions: <all_urls>**
The extension's sole function is to restyle whichever page the user is viewing,
so it must be able to inject its stylesheet on any site the user chooses to
enable it on. The content script only appends a <style> element and reads
computed background colors to detect pages that are already dark. It does not
read, collect, or transmit page content, form data, or browsing history.

## Privacy · Are you using remote code?
**No.** All code is contained in the package. No remote scripts, no eval(),
no externally hosted resources.

## Privacy · Data usage（数据用途）
不勾选任何数据收集项。本扩展不收集、不传输、不出售任何用户数据，没有任何网络请求。

## Privacy · Privacy policy URL
Edge 要求申请了敏感权限的扩展提供隐私政策链接。用 store/privacy-policy.md 的内容，
发布到任一公开可访问的地址即可（GitHub Pages、Gist raw、自己的站点都行）。

## Store listings · Description（必填，250–10000 字符）

Force Dark 让任何网站都能以深色显示，无论该网站自身是否提供深色主题。

工作原理：向页面注入 CSS 滤镜（反色 + 色相旋转），把浅色背景变暗的同时把色相转回原样，
因此蓝色链接仍是蓝色而不会变成橙色。图片、视频、canvas、iframe 会再套一层反向滤镜，
保持原本的颜色不被影响。

主要功能：

• 全局总开关，一键对所有网站生效或关闭。
• 按站点独立设置：跟随全局 / 开启 / 关闭 / 强制，按域名记忆。
• 智能模式（默认）：自动检测页面背景亮度，本身已经是深色的网站会被跳过，
  不会被反转成刺眼的白色；需要时可对单个站点选择"强制"。
• 亮度、对比度、灰度、护眼暖色四项微调，实时生效。
• 快捷键 Alt+Shift+D 快速切换当前站点。
• 在 document_start 阶段注入，先暗后判定，基本没有白屏闪烁。

隐私：本扩展不收集任何数据，没有任何网络请求，所有设置仅保存在你自己的浏览器中。

已知限制：对根元素应用滤镜会让 position: fixed 元素以根元素为包含块，极少数页面的
固定定位布局可能出现轻微偏移；浏览器内置页面（edge:// 等）因浏览器限制无法注入。

## Store listings · 图片素材
- Extension logo（必填，1:1，建议 300×300）→ store/logo-300.png
- Small promotional tile（可选，必须 440×280）→ store/tile-440x280.png
- Large promotional tile（可选，必须 1400×560）→ store/tile-1400x560.png
- Screenshots（可选，最多 6 张，必须 640×480 或 1280×800）→ store/screenshot-1/2/3-*.png，
  均为 1280×800。中英两个语言页签可用 Duplicate 共用同一组图。
  1 = Wikipedia 前后对比；2 = 深色页面 + 插件面板；3 = 中英双语界面

## Submit · Certification notes（给审核员的测试说明）
To test: install the extension, then open any light-colored website
(for example https://example.com). The page turns dark immediately.
Click the toolbar icon to open the popup: the global switch, the per-site
mode buttons, and the four sliders all take effect live.
Open a site that is already dark (for example https://github.com while
signed out with a dark OS theme) to see the "smart" mode skip it, and press
the "强制 / Force" button to override.
No account, no login, and no network access are required.

---

# 英文市场的商店文案（包内含 en 语言，Edge 要求每种语言都填 Description）

## Store listings · en-US · Description（≥250 字符）

Force Dark turns any website into a dark color scheme, whether or not that site
offers a dark theme of its own.

How it works: the extension applies a CSS filter (invert + hue-rotate) to the
page, so light backgrounds become dark while hues are rotated back to their
original values — blue links stay blue instead of turning orange. Images,
videos, canvas elements and iframes receive a counter-filter so their colors
are preserved exactly as the site intended.

Features:

• A global on/off switch that applies to every site at once.
• Per-site rules remembered by domain: Default, On, Off, or Force.
• Smart mode (default): the extension measures the page's background
  brightness and skips sites that are already dark, so a dark site is never
  inverted into a glaring white one. Choose "Force" to override this per site.
• Four live adjustments: brightness, contrast, grayscale and warmth.
• Keyboard shortcut Alt+Shift+D toggles the current site.
• Injected at document_start, so there is virtually no white flash on load.

Privacy: this extension collects no data and makes no network requests of any
kind. All settings stay in your own browser.

Known limitations: applying a filter to the root element makes it the
containing block for position: fixed elements, so a small number of pages may
show slight layout shifts. Browser-internal pages (edge://, the add-ons site)
cannot be modified, which is a browser restriction.

## 注意
包里现在有 en 和 zh_CN 两种语言，Edge 的 Store listings 会出现两个语言页签，
**Description 和 Extension logo 两项每个语言都必须填**（logo 可以用 Duplicate 复制过去）。
