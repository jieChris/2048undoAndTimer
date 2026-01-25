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
    
    // DEV Test 32k Button
    var devTestBtn = document.getElementById('dev-test-32k-btn');
    if (devTestBtn) {
        devTestBtn.addEventListener('click', function() {
            if (!window.game_manager) return;
            var gm = window.game_manager;
            
            if (confirm("这将重置当前游戏并设置测试环境：\n1. 开启 '已达成32k' 标记\n2. 模拟 8192 已有记录\n3. 放置两个 4096 供合成\n\n确定继续吗？")) {
                // 1. Set Flag
                gm.reached32k = true;
                
                // 2. Mock previous record
                var t8k = document.getElementById("timer8192");
                if (t8k) t8k.textContent = "00:10.00";
                
                // 3. Clear Grid
                gm.grid.eachCell(function(x, y, tile) {
                    if (tile) gm.grid.removeTile(tile);
                });
                
                // 4. Setup 4096s
                gm.grid.insertTile(new Tile({x: 0, y: 0}, 4096));
                gm.grid.insertTile(new Tile({x: 0, y: 1}, 4096)); // Vertical merge (Up/Down)
                
                // 5. Refresh
                gm.actuate();
                
                alert("环境已就绪！\n请按【上】或【下】键合并出 8192。\n观察右侧/下方 8192 计时器是否追加了当前时间。");
            }
        });
    }

});
