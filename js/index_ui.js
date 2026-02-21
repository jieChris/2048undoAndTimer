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
