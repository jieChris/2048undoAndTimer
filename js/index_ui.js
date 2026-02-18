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
  initThemeSettingsUI();
  initUndoSettingsUI();
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
  if (value >= 1024) {
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
  // Elements
  var originalSelect = document.getElementById("theme-select");
  var preview = document.getElementById("theme-preview-grid");
  var customTrigger = document.getElementById("theme-select-trigger");
  var customOptionsContainer = document.getElementById("theme-select-options");
  var customSelect = document.querySelector(".custom-select");

  if (!originalSelect || !preview || !window.ThemeManager) return;

  var themes = window.ThemeManager.getThemes();
  
  // State for Revert Logic
  var confirmedTheme = window.ThemeManager.getCurrentTheme();

  // 1. Populate Custom Options
  if (customOptionsContainer.children.length === 0) {
      customOptionsContainer.innerHTML = "";
      themes.forEach(function(theme) {
          var option = document.createElement("div");
          option.className = "custom-option";
          option.textContent = theme.label;
          option.dataset.value = theme.id;
          
          // Interaction: Select Theme (Commit)
          option.addEventListener("click", function(e) {
              e.stopPropagation(); // Prevent bubbling
              var value = this.dataset.value;
              confirmedTheme = value; // Update confirmed selection
              window.ThemeManager.applyTheme(value);
              closeDropdown();
          });

          // Interaction: Hover Preview (Scoped)
          option.addEventListener("mouseenter", function() {
              var style = document.getElementById("theme-preview-style");
              if (!style) {
                  style = document.createElement("style");
                  style.id = "theme-preview-style";
                  document.head.appendChild(style);
              }
              if (window.ThemeManager.getPreviewCss) {
                  style.textContent = window.ThemeManager.getPreviewCss(this.dataset.value);
              }
          });

          customOptionsContainer.appendChild(option);
      });
  }

  // 2. Custom Select Interaction
  function toggleDropdown(e) {
      if(e) e.stopPropagation();
      var isOpen = customSelect.classList.contains("open");
      
      if (isOpen) {
          closeDropdown();
      } else {
          // Open
          confirmedTheme = window.ThemeManager.getCurrentTheme(); // Sync confirmation
          customSelect.classList.add("open");
          
          // Scroll to selected
          var selectedParams = customOptionsContainer.querySelector(".custom-option.selected");
          if (selectedParams) {
               customOptionsContainer.scrollTop = selectedParams.offsetTop - customOptionsContainer.offsetTop;
          }
      }
  }

  function closeDropdown() {
      customSelect.classList.remove("open");
      // Clear preview style
      var style = document.getElementById("theme-preview-style");
      if (style) style.textContent = "";
  }

  // Bind Trigger
  if (!customTrigger.__bound) {
      customTrigger.addEventListener("click", toggleDropdown);
      customTrigger.__bound = true;
  }

  // Click Outside to Close
  if (!window.__clickOutsideBound) {
      document.addEventListener("click", function(e) {
          if (!customSelect.contains(e.target)) {
              closeDropdown();
          }
      });
      window.__clickOutsideBound = true;
  }
  
  // Revert when mouse leaves the options/dropdown area
  if (!customSelect.__mouseleaveBound) {
      customSelect.addEventListener("mouseleave", function() {
          if (customSelect.classList.contains("open")) {
               var style = document.getElementById("theme-preview-style");
               if (style) style.textContent = "";
          }
      });
      customSelect.__mouseleaveBound = true;
  }

  // 3. UI Update Helpers
  function updateCustomSelectUI() {
      var currentThemeId = window.ThemeManager.getCurrentTheme();
      
      // Update Trigger Text
      var label = "Select Theme";
      for (var i = 0; i < themes.length; i++) {
          if (themes[i].id === currentThemeId) {
              label = themes[i].label;
              break;
          }
      }
      customTrigger.querySelector("span").textContent = label;

      // Update Selected State in Options
      var options = customOptionsContainer.querySelectorAll(".custom-option");
      options.forEach(function(opt) {
          if (opt.dataset.value === currentThemeId) {
              opt.classList.add("selected");
          } else {
              opt.classList.remove("selected");
          }
      });
  }

  // Render Preview Grid (Tiles)
  function renderPreviewGrid() {
      var values = window.ThemeManager.getTileValues ?
        window.ThemeManager.getTileValues(getCurrentRuleset()) :
        [2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768, 65536];

      preview.innerHTML = "";
      for (var j = 0; j < values.length; j++) {
        var tile = document.createElement("div");
        tile.className = "theme-preview-tile theme-color-" + values[j];
        tile.textContent = formatPreviewValue(values[j]);
        preview.appendChild(tile);
      }
  }

  // Helper for formatting values (simplified version of original logic if needed, or assume global)
  // Check if formatPreviewValue is global or we need to inline it. 
  // It was used in original code, likely defined globally or in this scope previously.
  // Actually, checking previous view_file, `formatPreviewValue` was NOT defined in `initThemeSettingsUI`.
  // It must be a helper in index_ui.js.
  
  // Initial Render
  renderPreviewGrid();
  updateCustomSelectUI();
  
  // Sync if changed externally (e.g. from hovering, or from other tabs)
  if (!window.__themeChangeSyncBound) {
    window.__themeChangeSyncBound = true;
    window.addEventListener("themechange", function (e) {
       updateCustomSelectUI();
       // P.S. The grid tiles themselves don't change markup, just their classes/styles respond to body class.
       // So we don't need to re-render grid HTML on theme change, just CSS handles it.
    });
  }
}


function initUndoSettingsUI() {
  var toggle = document.getElementById("undo-enabled-toggle");
  var note = document.getElementById("undo-settings-note");
  if (!toggle) return;
  if (!window.game_manager) {
    setTimeout(initUndoSettingsUI, 60);
    return;
  }

  function sync() {
    var gm = window.game_manager;
    if (!gm) return;
    var forced = gm.getForcedUndoSettingForMode ? gm.getForcedUndoSettingForMode(gm.mode) : null;
    var allowed = gm.isUndoAllowedByMode ? gm.isUndoAllowedByMode(gm.mode) : true;
    var enabled = gm.isUndoInteractionEnabled ? gm.isUndoInteractionEnabled() : true;
    var canToggle = gm.canToggleUndoSetting ? gm.canToggleUndoSetting(gm.mode) : allowed;
    var undoLimit = Number.isInteger(gm.undoLimit) ? gm.undoLimit : null;
    var undoUsed = Number.isInteger(gm.undoUsed) ? gm.undoUsed : 0;
    toggle.disabled = !canToggle;
    toggle.checked = !!enabled;
    if (note) {
      if (!allowed || forced === false) {
        note.textContent = "该模式固定不可撤回。";
      } else if (forced === true) {
        if (undoLimit !== null) {
          note.textContent = "该模式固定可撤回（剩余 " + Math.max(0, undoLimit - undoUsed) + "/" + undoLimit + " 次）。";
        } else {
          note.textContent = "该模式固定可撤回，不能关闭。";
        }
      } else if (gm.hasGameStarted) {
        if (undoLimit !== null) {
          note.textContent = "本局已开始，撤回开关只能在开局前设置。剩余撤回 " + Math.max(0, undoLimit - undoUsed) + "/" + undoLimit + " 次。";
        } else {
          note.textContent = "本局已开始，撤回开关只能在开局前设置。";
        }
      } else {
        note.textContent = undoLimit !== null
          ? ("当前模式可切换撤回功能（仅开局前），本局上限 " + undoLimit + " 次。")
          : "当前模式可切换撤回功能（仅开局前）。";
      }
    }
  }
  window.syncUndoSettingsUI = sync;

  if (!toggle.__undoBound) {
    toggle.__undoBound = true;
    toggle.addEventListener("change", function () {
      if (!window.game_manager || !window.game_manager.setUndoEnabled) return;
      window.game_manager.setUndoEnabled(this.checked);
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
    initUndoSettingsUI();

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
