// Logic extracted from index.html

// Replay Modal Functions
function showReplayModal(title, content, actionName, actionCallback) {
  var modal = document.getElementById('replay-modal');
  var titleEl = document.getElementById('replay-modal-title');
  var textEl = document.getElementById('replay-textarea');
  var actionBtn = document.getElementById('replay-action-btn');

  if (!modal) return;

  modal.style.display = 'flex';
  titleEl.textContent = title;
  textEl.value = content;
  
  if (actionName) {
    actionBtn.style.display = 'inline-block';
    actionBtn.textContent = actionName;
    actionBtn.onclick = function() {
      actionCallback(textEl.value);
    };
  } else {
    actionBtn.style.display = 'none';
  }
  
  // Bind close button here since it might not be bound if modal was hidden
  var closeBtn = modal.querySelector('.replay-button:not(#replay-action-btn)');
  if(closeBtn) {
      closeBtn.onclick = window.closeReplayModal;
  }
}

window.closeReplayModal = function() {
  var modal = document.getElementById('replay-modal');
  if (modal) {
    modal.style.display = 'none';
  }
};

window.openSettingsModal = function () {
  var modal = document.getElementById("settings-modal");
  if (modal) {
    modal.style.display = "flex";
  }
  removeLegacyUndoSettingsUI();
  initThemeSettingsUI();
  initTimerModuleSettingsUI();
  initHomeGuideSettingsUI();
};

window.closeSettingsModal = function () {
  var modal = document.getElementById("settings-modal");
  if (modal) {
    modal.style.display = "none";
  }
};

window.exportReplay = function() {
   if (window.game_manager) {
     var replay = window.game_manager.serialize();
     
     // Show Modal first so user can see it
     showReplayModal("导出回放", replay, "再次复制", function(text) {
       copyToClipboard(text);
     });
     
     // Auto Copy
     copyToClipboard(replay);
   }
};

var PRACTICE_TRANSFER_KEY = "practice_board_transfer_v1";
var PRACTICE_TRANSFER_SESSION_KEY = "practice_board_transfer_session_v1";
var PRACTICE_GUIDE_SHOWN_KEY = "practice_guide_shown_v2";
var PRACTICE_GUIDE_SEEN_FLAG = "practice_guide_seen_v2=1";

function getStorageByName(name) {
  try {
    return window && window[name] ? window[name] : null;
  } catch (_err) {
    return null;
  }
}

function safeSetStorageItem(storage, key, value) {
  if (!storage || !key) return false;
  try {
    storage.setItem(key, value);
    return true;
  } catch (_err) {
    return false;
  }
}

function safeReadStorageItem(storage, key) {
  if (!storage || !key) return null;
  try {
    return storage.getItem(key);
  } catch (_err) {
    return null;
  }
}

function hasCookieFlag(key, value) {
  try {
    var all = document.cookie || "";
    return all.indexOf(key + "=" + value) !== -1;
  } catch (_err) {
    return false;
  }
}

function hasWindowNameFlag(flag) {
  try {
    return typeof window.name === "string" && window.name.indexOf(flag) !== -1;
  } catch (_err) {
    return false;
  }
}

function appendQueryParam(url, key, value) {
  var sep = url.indexOf("?") === -1 ? "?" : "&";
  return url + sep + encodeURIComponent(key) + "=" + encodeURIComponent(value);
}

function hasPracticeGuideSeen() {
  var localStore = getStorageByName("localStorage");
  var sessionStore = getStorageByName("sessionStorage");
  return (
    safeReadStorageItem(localStore, PRACTICE_GUIDE_SHOWN_KEY) === "1" ||
    safeReadStorageItem(sessionStore, PRACTICE_GUIDE_SHOWN_KEY) === "1" ||
    hasCookieFlag(PRACTICE_GUIDE_SHOWN_KEY, "1") ||
    hasWindowNameFlag(PRACTICE_GUIDE_SEEN_FLAG)
  );
}

function cloneJsonSafe(value) {
  try {
    return JSON.parse(JSON.stringify(value));
  } catch (_err) {
    return null;
  }
}

function buildPracticeModeConfigFromCurrent(gm) {
  var cfg = (window.GAME_MODE_CONFIG && typeof window.GAME_MODE_CONFIG === "object")
    ? window.GAME_MODE_CONFIG
    : ((gm && gm.modeConfig && typeof gm.modeConfig === "object") ? gm.modeConfig : {});
  var ruleset = cfg.ruleset === "fibonacci" ? "fibonacci" : "pow2";
  var width = Number.isInteger(cfg.board_width) && cfg.board_width > 0
    ? cfg.board_width
    : (Number.isInteger(gm.width) && gm.width > 0 ? gm.width : 4);
  var height = Number.isInteger(cfg.board_height) && cfg.board_height > 0
    ? cfg.board_height
    : (Number.isInteger(gm.height) && gm.height > 0 ? gm.height : width);
  var spawnTable = (Array.isArray(cfg.spawn_table) && cfg.spawn_table.length > 0)
    ? cloneJsonSafe(cfg.spawn_table)
    : (ruleset === "fibonacci"
      ? [{ value: 1, weight: 90 }, { value: 2, weight: 10 }]
      : [{ value: 2, weight: 90 }, { value: 4, weight: 10 }]);
  var modeConfig = {
    key: "practice_legacy",
    label: "练习板（直通）",
    board_width: width,
    board_height: height,
    ruleset: ruleset,
    undo_enabled: true,
    spawn_table: spawnTable,
    ranked_bucket: "none",
    mode_family: cfg.mode_family || (ruleset === "fibonacci" ? "fibonacci" : "pow2"),
    rank_policy: "unranked",
    special_rules: cloneJsonSafe(cfg.special_rules) || {}
  };
  if (Number.isInteger(cfg.max_tile) && cfg.max_tile > 0) {
    modeConfig.max_tile = cfg.max_tile;
  }
  return modeConfig;
}

window.openPracticeBoardFromCurrent = function () {
  var gm = window.game_manager;
  if (!gm || typeof gm.getFinalBoardMatrix !== "function") {
    alert("当前局面尚未就绪，稍后再试。");
    return;
  }
  var board = gm.getFinalBoardMatrix();
  if (!Array.isArray(board) || board.length === 0) {
    alert("未读取到有效盘面。");
    return;
  }

  var token = "p" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
  var payload = {
    token: token,
    created_at: Date.now(),
    board: cloneJsonSafe(board) || board,
    mode_config: buildPracticeModeConfigFromCurrent(gm)
  };

  var payloadStr = JSON.stringify(payload);
  var baseUrl = "Practice_board.html?practice_token=" + encodeURIComponent(token);
  if (hasPracticeGuideSeen()) {
    baseUrl = appendQueryParam(baseUrl, "practice_guide_seen", "1");
  }
  var persisted = false;
  var localStore = getStorageByName("localStorage");
  var sessionStore = getStorageByName("sessionStorage");

  persisted = safeSetStorageItem(localStore, PRACTICE_TRANSFER_KEY, payloadStr);
  if (!persisted) {
    persisted = safeSetStorageItem(sessionStore, PRACTICE_TRANSFER_SESSION_KEY, payloadStr);
  }

  if (persisted) {
    window.open(baseUrl, "_blank");
    return;
  }

  // Final fallback: pass payload through URL when both storages are unavailable.
  var urlWithPayload = baseUrl + "&practice_payload=" + encodeURIComponent(payloadStr);
  window.open(urlWithPayload, "_blank");
};


function copyToClipboard(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(function() {
            alert("回放代码已复制到剪贴板！");
        }).catch(function(err) {
            // Fallback if async failure
            fallbackCopy(text);
        });
    } else {
        fallbackCopy(text);
    }
}

function fallbackCopy(text) {
    try {
      var textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";  // Avoid scrolling to bottom
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert("回放代码已复制到剪贴板！");
    } catch (err) {
      console.error('Fallback copy failed', err);
      alert("自动复制失败，请手动从文本框复制。");
    }
}

// Pretty print time function (Legacy support just in case)
window.pretty = function(time) {
  if (time < 0) {return "DNF";}
    var bits = time % 1000;
    time = (time - bits) / 1000;
    var secs = time % 60;
    var mins = ((time - secs) / 60) % 60;
    var hours = (time - secs - 60 * mins) / 3600;
    var s = "" + bits;
    if (bits < 10) {s = "0" + s;}
    if (bits < 100) {s = "0" + s;}
    s = secs + "." + s;
    if (secs < 10 && (mins > 0 || hours > 0)) {s = "0" + s;}
    if (mins > 0 || hours > 0) {s = mins + ":" + s;}
    if (mins < 10 && hours > 0) {s = "0" + s;}
    if (hours > 0) {s = hours + ":" + s;}
  return s;
};

function formatPreviewValue(value) {
  if (value >= 1024 && value % 1024 === 0) {
    return (value / 1024) + "K";
  }
  return "" + value;
}

function getCurrentRuleset() {
  if (typeof document !== "undefined" && document.body) {
    var ruleset = document.body.getAttribute("data-ruleset");
    if (ruleset === "fibonacci") return "fibonacci";
  }
  if (window.GAME_MODE_CONFIG && window.GAME_MODE_CONFIG.ruleset === "fibonacci") {
    return "fibonacci";
  }
  return "pow2";
}

function initThemeSettingsUI() {
  var originalSelect = document.getElementById("theme-select");
  var previewRoot = document.getElementById("theme-preview-grid");
  var customTrigger = document.getElementById("theme-select-trigger");
  var customOptionsContainer = document.getElementById("theme-select-options");
  var customSelect = document.querySelector(".custom-select");

  if (!originalSelect || !previewRoot || !window.ThemeManager || !customTrigger || !customOptionsContainer || !customSelect) return;

  var themes = window.ThemeManager.getThemes();
  var confirmedTheme = window.ThemeManager.getCurrentTheme();

  function ensurePreviewStyleTag() {
    var style = document.getElementById("theme-preview-style");
    if (!style) {
      style = document.createElement("style");
      style.id = "theme-preview-style";
      document.head.appendChild(style);
    }
    return style;
  }

  function ensureDualPreviewGrids() {
    if (previewRoot.__dualPreviewRefs) return previewRoot.__dualPreviewRefs;
    previewRoot.className = "theme-preview-dual-wrap";
    previewRoot.innerHTML =
      "<div class='theme-preview-grid-block'>" +
      "<div class='theme-preview-grid-title'>2幂</div>" +
      "<div id='theme-preview-grid-pow2' class='theme-preview-grid'></div>" +
      "</div>" +
      "<div class='theme-preview-grid-block'>" +
      "<div class='theme-preview-grid-title'>Fibonacci</div>" +
      "<div id='theme-preview-grid-fib' class='theme-preview-grid'></div>" +
      "</div>";
    previewRoot.__dualPreviewRefs = {
      pow2: document.getElementById("theme-preview-grid-pow2"),
      fib: document.getElementById("theme-preview-grid-fib")
    };
    return previewRoot.__dualPreviewRefs;
  }

  function renderPreviewGrid(gridEl, values) {
    if (!gridEl) return;
    gridEl.innerHTML = "";
    for (var i = 0; i < values.length; i++) {
      var value = values[i];
      var tile = document.createElement("div");
      tile.className = "theme-preview-tile theme-color-" + value;
      tile.textContent = formatPreviewValue(value);
      gridEl.appendChild(tile);
    }
  }

  function renderDualPreviewGrids() {
    var refs = ensureDualPreviewGrids();
    var pow2Values = window.ThemeManager.getTileValues
      ? window.ThemeManager.getTileValues("pow2")
      : [2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768, 65536];
    var fibValues = window.ThemeManager.getTileValues
      ? window.ThemeManager.getTileValues("fibonacci")
      : [1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610, 987, 1597];
    renderPreviewGrid(refs.pow2, pow2Values);
    renderPreviewGrid(refs.fib, fibValues);
  }

  function getPreviewCss(themeId) {
    if (!window.ThemeManager.getPreviewCss) return "";
    return window.ThemeManager.getPreviewCss(themeId, {
      pow2Selector: "#theme-preview-grid-pow2",
      fibSelector: "#theme-preview-grid-fib"
    });
  }

  function applyPreviewTheme(themeId) {
    var style = ensurePreviewStyleTag();
    style.textContent = getPreviewCss(themeId);
  }

  if (customOptionsContainer.children.length === 0) {
    customOptionsContainer.innerHTML = "";
    themes.forEach(function(theme) {
      var option = document.createElement("div");
      option.className = "custom-option";
      option.textContent = theme.label;
      option.dataset.value = theme.id;
      option.addEventListener("click", function(e) {
        e.stopPropagation();
        var value = this.dataset.value;
        confirmedTheme = value;
        window.ThemeManager.applyTheme(value);
        applyPreviewTheme(value);
        closeDropdown();
      });
      option.addEventListener("mouseenter", function() {
        applyPreviewTheme(this.dataset.value);
      });
      customOptionsContainer.appendChild(option);
    });
  }

  function toggleDropdown(e) {
    if (e) e.stopPropagation();
    var isOpen = customSelect.classList.contains("open");
    if (isOpen) {
      closeDropdown();
    } else {
      confirmedTheme = window.ThemeManager.getCurrentTheme();
      customSelect.classList.add("open");
      var selected = customOptionsContainer.querySelector(".custom-option.selected");
      if (selected) {
        customOptionsContainer.scrollTop = selected.offsetTop - customOptionsContainer.offsetTop;
      }
    }
  }

  function closeDropdown() {
    customSelect.classList.remove("open");
    applyPreviewTheme(confirmedTheme);
  }

  if (!customTrigger.__bound) {
    customTrigger.addEventListener("click", toggleDropdown);
    customTrigger.__bound = true;
  }

  if (!window.__clickOutsideBound) {
    document.addEventListener("click", function(e) {
      if (!customSelect.contains(e.target)) {
        closeDropdown();
      }
    });
    window.__clickOutsideBound = true;
  }

  if (!customSelect.__mouseleaveBound) {
    customSelect.addEventListener("mouseleave", function() {
      if (customSelect.classList.contains("open")) {
        applyPreviewTheme(confirmedTheme);
      }
    });
    customSelect.__mouseleaveBound = true;
  }

  function updateCustomSelectUI() {
    var currentThemeId = window.ThemeManager.getCurrentTheme();
    var label = "选择主题";
    for (var i = 0; i < themes.length; i++) {
      if (themes[i].id === currentThemeId) {
        label = themes[i].label;
        break;
      }
    }
    var triggerText = customTrigger.querySelector("span");
    if (triggerText) triggerText.textContent = label;
    var options = customOptionsContainer.querySelectorAll(".custom-option");
    options.forEach(function(opt) {
      if (opt.dataset.value === currentThemeId) {
        opt.classList.add("selected");
      } else {
        opt.classList.remove("selected");
      }
    });
  }

  renderDualPreviewGrids();
  updateCustomSelectUI();
  applyPreviewTheme(confirmedTheme);

  if (!window.__themeChangeSyncBound) {
    window.__themeChangeSyncBound = true;
    window.addEventListener("themechange", function () {
      confirmedTheme = window.ThemeManager.getCurrentTheme();
      updateCustomSelectUI();
      applyPreviewTheme(confirmedTheme);
    });
  }
}


function removeLegacyUndoSettingsUI() {
  var toggle = document.getElementById("undo-enabled-toggle");
  if (!toggle) return;
  var row = toggle.closest(".settings-row");
  if (row && row.parentNode) {
    row.parentNode.removeChild(row);
  } else {
    toggle.style.display = "none";
  }
}

function ensureTimerModuleSettingsDom() {
  var modal = document.getElementById("settings-modal");
  if (!modal) return null;
  if (document.getElementById("timer-module-view-toggle")) {
    return document.getElementById("timer-module-view-toggle");
  }
  var content = modal.querySelector(".settings-modal-content");
  if (!content) return null;

  var row = document.createElement("div");
  row.className = "settings-row";
  row.innerHTML =
    "<label for='timer-module-view-toggle'>计时器显示</label>" +
    "<label class='settings-switch-row'>" +
    "<input id='timer-module-view-toggle' type='checkbox'>" +
    "<span>显示计时器（关闭后隐藏）</span>" +
    "</label>" +
    "<div id='timer-module-view-note' class='settings-note'></div>";

  var actions = content.querySelector(".replay-modal-actions");
  if (actions && actions.parentNode === content) {
    content.insertBefore(row, actions);
  } else {
    content.appendChild(row);
  }
  return document.getElementById("timer-module-view-toggle");
}

function initTimerModuleSettingsUI() {
  var toggle = ensureTimerModuleSettingsDom();
  var note = document.getElementById("timer-module-view-note");
  if (!toggle) return;
  if (!window.game_manager) {
    setTimeout(initTimerModuleSettingsUI, 60);
    return;
  }

  function sync() {
    var gm = window.game_manager;
    if (!gm) return;
    var view = gm.getTimerModuleViewMode ? gm.getTimerModuleViewMode() : "timer";
    toggle.disabled = false;
    toggle.checked = view !== "hidden";
    if (note) {
      note.textContent = "关闭后仅隐藏右侧计时器栏，不影响棋盘和回放。";
    }
  }
  window.syncTimerModuleSettingsUI = sync;

  if (!toggle.__timerViewBound) {
    toggle.__timerViewBound = true;
    toggle.addEventListener("change", function () {
      if (!window.game_manager || !window.game_manager.setTimerModuleViewMode) return;
      window.game_manager.setTimerModuleViewMode(this.checked ? "timer" : "hidden");
      sync();
    });
  }

  sync();
}

var HOME_GUIDE_SEEN_KEY = "home_guide_seen_v1";
var HOME_GUIDE_STATE = {
  active: false,
  fromSettings: false,
  index: 0,
  steps: [],
  target: null,
  elevated: [],
  panel: null,
  overlay: null
};

function isHomePage() {
  if (typeof window === "undefined" || !window.location) return false;
  var path = String(window.location.pathname || "");
  return path === "/" || /\/index\.html?$/.test(path) || path === "";
}

function getHomeGuideSteps() {
  return [
    { selector: "#home-title-link", title: "首页标题", desc: "点击 2048 标题可回到首页。" },
    { selector: "#top-announcement-btn", title: "版本公告", desc: "查看版本更新内容，红点表示有未读公告。" },
    { selector: "#stats-panel-toggle", title: "统计", desc: "打开统计汇总面板，查看步数和出数数据。" },
    { selector: "#top-export-replay-btn", title: "导出回放", desc: "导出当前对局回放字符串，便于保存和复盘。" },
    { selector: "#top-practice-btn", title: "直通练习板", desc: "把当前盘面复制到练习板，并在新页继续调试。" },
    { selector: "#top-advanced-replay-btn", title: "高级回放", desc: "进入高级回放页，导入并控制回放进度。" },
    { selector: "#top-modes-btn", title: "模式选择", desc: "进入模式页面，切换不同棋盘和玩法。" },
    { selector: "#top-history-btn", title: "历史记录", desc: "查看本地历史记录，支持删除/导入/导出。" },
    { selector: "#top-settings-btn", title: "设置", desc: "打开设置，调整主题、计时器显示与指引开关。" },
    { selector: "#top-restart-btn", title: "新游戏", desc: "开始新的一局，会重置当前局面。" }
  ];
}

function ensureHomeGuideDom() {
  var overlay = document.getElementById("home-guide-overlay");
  var panel = document.getElementById("home-guide-panel");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "home-guide-overlay";
    overlay.className = "home-guide-overlay";
    overlay.style.display = "none";
    document.body.appendChild(overlay);
  }
  if (!panel) {
    panel = document.createElement("div");
    panel.id = "home-guide-panel";
    panel.className = "home-guide-panel";
    panel.style.display = "none";
    panel.innerHTML =
      "<div id='home-guide-step' class='home-guide-step'></div>" +
      "<div id='home-guide-title' class='home-guide-title'></div>" +
      "<div id='home-guide-desc' class='home-guide-desc'></div>" +
      "<div class='home-guide-actions'>" +
      "<button id='home-guide-prev' class='replay-button home-guide-btn'>上一步</button>" +
      "<button id='home-guide-next' class='replay-button home-guide-btn'>下一步</button>" +
      "<button id='home-guide-skip' class='replay-button home-guide-btn'>跳过</button>" +
      "</div>";
    document.body.appendChild(panel);
  }
  HOME_GUIDE_STATE.overlay = overlay;
  HOME_GUIDE_STATE.panel = panel;
  return { overlay: overlay, panel: panel };
}

function clearHomeGuideHighlight() {
  if (HOME_GUIDE_STATE.target && HOME_GUIDE_STATE.target.classList) {
    HOME_GUIDE_STATE.target.classList.remove("home-guide-highlight");
  }
  var scoped = document.querySelectorAll(".home-guide-scope");
  for (var s = 0; s < scoped.length; s++) {
    scoped[s].classList.remove("home-guide-scope");
  }
  if (Array.isArray(HOME_GUIDE_STATE.elevated)) {
    for (var i = 0; i < HOME_GUIDE_STATE.elevated.length; i++) {
      var node = HOME_GUIDE_STATE.elevated[i];
      if (node && node.classList) node.classList.remove("home-guide-elevated");
    }
  }
  HOME_GUIDE_STATE.elevated = [];
  HOME_GUIDE_STATE.target = null;
}

function elevateHomeGuideTarget(target) {
  if (!target || !target.closest) return;
  var elevated = [];
  var stackHost = target.closest(".top-action-buttons");
  if (!stackHost) stackHost = target.closest(".heading");
  if (stackHost && stackHost.classList) {
    stackHost.classList.add("home-guide-elevated");
    elevated.push(stackHost);
  }
  var topActionButtons = target.closest(".top-action-buttons");
  if (topActionButtons && topActionButtons.classList) {
    topActionButtons.classList.add("home-guide-scope");
  }
  HOME_GUIDE_STATE.elevated = elevated;
}

function positionHomeGuidePanel() {
  var panel = HOME_GUIDE_STATE.panel;
  var target = HOME_GUIDE_STATE.target;
  if (!panel || !target) return;

  var rect = target.getBoundingClientRect();
  var margin = 12;
  var panelWidth = Math.min(430, Math.max(280, window.innerWidth - margin * 2));
  panel.style.maxWidth = panelWidth + "px";
  panel.style.width = panelWidth + "px";

  var panelHeight = panel.offsetHeight || 160;
  var top = rect.bottom + margin;
  if (top + panelHeight > window.innerHeight - margin) {
    top = rect.top - panelHeight - margin;
  }
  if (top < margin) top = margin;

  var left = rect.left + rect.width / 2 - panelWidth / 2;
  if (left < margin) left = margin;
  if (left + panelWidth > window.innerWidth - margin) {
    left = window.innerWidth - panelWidth - margin;
  }

  panel.style.top = Math.round(top) + "px";
  panel.style.left = Math.round(left) + "px";
}

function showHomeGuideDoneNotice() {
  var toast = document.getElementById("home-guide-done-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "home-guide-done-toast";
    toast.style.position = "fixed";
    toast.style.left = "50%";
    toast.style.bottom = "26px";
    toast.style.transform = "translateX(-50%)";
    toast.style.background = "rgba(46, 40, 34, 0.94)";
    toast.style.color = "#f9f6f2";
    toast.style.padding = "10px 14px";
    toast.style.borderRadius = "8px";
    toast.style.fontSize = "14px";
    toast.style.fontWeight = "bold";
    toast.style.zIndex = "3400";
    toast.style.boxShadow = "0 6px 20px rgba(0,0,0,0.35)";
    toast.style.opacity = "0";
    toast.style.transition = "opacity 160ms ease";
    document.body.appendChild(toast);
  }
  toast.textContent = "指引已完成，可在设置中重新打开新手指引。";
  toast.style.opacity = "1";
  if (toast.__hideTimer) clearTimeout(toast.__hideTimer);
  toast.__hideTimer = setTimeout(function () {
    toast.style.opacity = "0";
  }, 2600);
}

function finishHomeGuide(markSeen, options) {
  options = options || {};
  clearHomeGuideHighlight();
  HOME_GUIDE_STATE.active = false;
  HOME_GUIDE_STATE.steps = [];
  HOME_GUIDE_STATE.index = 0;
  if (HOME_GUIDE_STATE.overlay) HOME_GUIDE_STATE.overlay.style.display = "none";
  if (HOME_GUIDE_STATE.panel) HOME_GUIDE_STATE.panel.style.display = "none";
  if (markSeen) {
    try {
      localStorage.setItem(HOME_GUIDE_SEEN_KEY, "1");
    } catch (_err) {}
  }
  HOME_GUIDE_STATE.fromSettings = false;
  if (typeof window.syncHomeGuideSettingsUI === "function") {
    window.syncHomeGuideSettingsUI();
  }
  if (options.showDoneNotice) {
    showHomeGuideDoneNotice();
  }
}

function showHomeGuideStep(index) {
  if (!HOME_GUIDE_STATE.active || !HOME_GUIDE_STATE.steps.length) return;
  if (index < 0) index = 0;
  if (index >= HOME_GUIDE_STATE.steps.length) {
    finishHomeGuide(true, { showDoneNotice: true });
    return;
  }
  HOME_GUIDE_STATE.index = index;
  clearHomeGuideHighlight();

  var step = HOME_GUIDE_STATE.steps[index];
  var target = document.querySelector(step.selector);
  if (!target) {
    showHomeGuideStep(index + 1);
    return;
  }
  HOME_GUIDE_STATE.target = target;
  target.classList.add("home-guide-highlight");
  elevateHomeGuideTarget(target);

  var stepEl = document.getElementById("home-guide-step");
  var titleEl = document.getElementById("home-guide-title");
  var descEl = document.getElementById("home-guide-desc");
  var prevBtn = document.getElementById("home-guide-prev");
  var nextBtn = document.getElementById("home-guide-next");

  if (stepEl) stepEl.textContent = "步骤 " + (index + 1) + " / " + HOME_GUIDE_STATE.steps.length;
  if (titleEl) titleEl.textContent = step.title;
  if (descEl) descEl.textContent = step.desc;
  if (prevBtn) prevBtn.disabled = index <= 0;
  if (nextBtn) nextBtn.textContent = index >= HOME_GUIDE_STATE.steps.length - 1 ? "完成" : "下一步";

  window.requestAnimationFrame(positionHomeGuidePanel);
}

function startHomeGuide(options) {
  options = options || {};
  if (!isHomePage()) return;

  var dom = ensureHomeGuideDom();
  HOME_GUIDE_STATE.active = true;
  HOME_GUIDE_STATE.fromSettings = !!options.fromSettings;
  HOME_GUIDE_STATE.steps = getHomeGuideSteps();
  HOME_GUIDE_STATE.index = 0;

  dom.overlay.style.display = "block";
  dom.panel.style.display = "block";

  var prevBtn = document.getElementById("home-guide-prev");
  var nextBtn = document.getElementById("home-guide-next");
  var skipBtn = document.getElementById("home-guide-skip");

  if (prevBtn && !prevBtn.__homeGuideBound) {
    prevBtn.__homeGuideBound = true;
    prevBtn.addEventListener("click", function () {
      showHomeGuideStep(HOME_GUIDE_STATE.index - 1);
    });
  }
  if (nextBtn && !nextBtn.__homeGuideBound) {
    nextBtn.__homeGuideBound = true;
    nextBtn.addEventListener("click", function () {
      showHomeGuideStep(HOME_GUIDE_STATE.index + 1);
    });
  }
  if (skipBtn && !skipBtn.__homeGuideBound) {
    skipBtn.__homeGuideBound = true;
    skipBtn.addEventListener("click", function () {
      finishHomeGuide(true);
    });
  }

  showHomeGuideStep(0);
  if (typeof window.syncHomeGuideSettingsUI === "function") {
    window.syncHomeGuideSettingsUI();
  }
}

function ensureHomeGuideSettingsDom() {
  var modal = document.getElementById("settings-modal");
  if (!modal) return null;
  if (document.getElementById("home-guide-toggle")) {
    return document.getElementById("home-guide-toggle");
  }
  var content = modal.querySelector(".settings-modal-content");
  if (!content) return null;

  var row = document.createElement("div");
  row.className = "settings-row";
  row.innerHTML =
    "<label for='home-guide-toggle'>新手指引</label>" +
    "<label class='settings-switch-row'>" +
    "<input id='home-guide-toggle' type='checkbox'>" +
    "<span>重新播放首页功能指引</span>" +
    "</label>" +
    "<div id='home-guide-note' class='settings-note'></div>";

  var actions = content.querySelector(".replay-modal-actions");
  if (actions && actions.parentNode === content) {
    content.insertBefore(row, actions);
  } else {
    content.appendChild(row);
  }
  return document.getElementById("home-guide-toggle");
}

function initHomeGuideSettingsUI() {
  var toggle = ensureHomeGuideSettingsDom();
  var note = document.getElementById("home-guide-note");
  if (!toggle) return;

  function sync() {
    var home = isHomePage();
    toggle.disabled = !home;
    toggle.checked = !!(HOME_GUIDE_STATE.active && HOME_GUIDE_STATE.fromSettings);
    if (note) {
      note.textContent = home
        ? "打开后将立即进入首页新手引导，完成后自动关闭。"
        : "该功能仅在首页可用。";
    }
  }

  window.syncHomeGuideSettingsUI = sync;

  if (!toggle.__homeGuideBound) {
    toggle.__homeGuideBound = true;
    toggle.addEventListener("change", function () {
      if (!this.checked) return;
      if (!isHomePage()) {
        sync();
        return;
      }
      window.closeSettingsModal();
      startHomeGuide({ fromSettings: true });
    });
  }

  sync();
}

function autoStartHomeGuideIfNeeded() {
  if (!isHomePage()) return;
  var seen = "0";
  try {
    seen = localStorage.getItem(HOME_GUIDE_SEEN_KEY) || "0";
  } catch (_err) {
    seen = "0";
  }
  if (seen === "1") return;
  setTimeout(function () {
    startHomeGuide({ fromSettings: false });
  }, 260);
}

// Initialize Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    // Undo Link
    var undoLink = document.getElementById('undo-link');
    if (undoLink) {
        undoLink.addEventListener('click', function(e) {
            e.preventDefault();
            if (window.game_manager && window.game_manager.isUndoInteractionEnabled && window.game_manager.isUndoInteractionEnabled()) {
                window.game_manager.move(-1);
            }
        });
    }

    // Export Replay Button (Top Bar)
    var exportBtn = document.getElementById('top-export-replay-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', function(e) {
            e.preventDefault();
            window.exportReplay();
        });
    }

    var practiceBtn = document.getElementById("top-practice-btn");
    if (practiceBtn) {
      practiceBtn.addEventListener("click", function (e) {
        e.preventDefault();
        window.openPracticeBoardFromCurrent();
      });
    }


    // Settings Button (Top Bar)
    var settingsBtn = document.getElementById("top-settings-btn");
    if (settingsBtn) {
      settingsBtn.addEventListener("click", function (e) {
        e.preventDefault();
        window.openSettingsModal();
      });
    }

    var settingsCloseBtn = document.getElementById("settings-close-btn");
    if (settingsCloseBtn) {
      settingsCloseBtn.addEventListener("click", function (e) {
        e.preventDefault();
        window.closeSettingsModal();
      });
    }

    var settingsModal = document.getElementById("settings-modal");
    if (settingsModal) {
      settingsModal.addEventListener("click", function (e) {
        if (e.target === settingsModal) {
          window.closeSettingsModal();
        }
      });
    }

    initThemeSettingsUI();
    removeLegacyUndoSettingsUI();
    initTimerModuleSettingsUI();
    initHomeGuideSettingsUI();
    autoStartHomeGuideIfNeeded();

    // Undo Button on Game Over Screen
    var undoBtnGameOver = document.getElementById('undo-btn-gameover');
    if (undoBtnGameOver) {
        undoBtnGameOver.addEventListener('click', function(e) {
            e.preventDefault();
            if (window.game_manager && window.game_manager.isUndoInteractionEnabled && window.game_manager.isUndoInteractionEnabled()) {
                window.game_manager.move(-1);
            }
        });
    }
    


});
