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

// Initialize Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    // Undo Link
    var undoLink = document.getElementById('undo-link');
    if (undoLink) {
        undoLink.addEventListener('click', function(e) {
            e.preventDefault();
            if (window.game_manager) {
                window.game_manager.move(-1);
            }
        });
    }

    // Export Replay Button
    var exportBtn = document.querySelector('.export-replay-button');
    if (exportBtn) {
        exportBtn.addEventListener('click', function(e) {
            e.preventDefault();
            window.exportReplay();
        });
    }

    // Undo Button on Game Over Screen
    var undoBtnGameOver = document.getElementById('undo-btn-gameover');
    if (undoBtnGameOver) {
        undoBtnGameOver.addEventListener('click', function(e) {
            e.preventDefault();
            if (window.game_manager) {
                window.game_manager.move(-1);
            }
        });
        undoBtnGameOver.addEventListener('click', function(e) {
            e.preventDefault();
            if (window.game_manager) {
                window.game_manager.move(-1);
            }
        });
    }
    


});
