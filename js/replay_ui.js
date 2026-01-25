// Logic extracted from replay.html

// Guide Logic
(function() {
    var guideKey = 'replay_guide_shown_v1';
    if (!localStorage.getItem(guideKey)) {
        // Wait for DOMContentLoaded is handled by script load order or event, but let's be safe inside the main listener or check if body exists
        // Since replay_ui.js is loaded at end of body, elements should exist.
        var overlay = document.getElementById('guide-overlay');
        var message = document.getElementById('guide-message');
        var titleLink = document.querySelector('.title a');
        
        if (overlay && titleLink && message) {
            // Show overlay
            overlay.style.display = 'block';
            
            // Highlight Link
            titleLink.classList.add('guide-highlight');
            
            // Position Message
            var rect = titleLink.getBoundingClientRect();
            // Position below the title roughly
            message.style.top = (rect.bottom + 15) + 'px';
            message.style.left = (rect.left + 20) + 'px';
            
            // Dismiss Function
            function dismiss() {
                overlay.style.display = 'none';
                titleLink.classList.remove('guide-highlight');
                localStorage.setItem(guideKey, 'true');
            }
            
            // Bind Events
            overlay.addEventListener('click', dismiss);
            titleLink.addEventListener('click', function() {
                dismiss();
            });
        }
    }
})();

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
}

window.closeReplayModal = function() {
  var modal = document.getElementById('replay-modal');
  if (modal) {
    modal.style.display = 'none';
  }
};

// Replay Specific Functions
window.importReplay = function() {
   showReplayModal("导入回放", "", "开始回放", function(text) {
     if (text && window.game_manager) {
         window.game_manager.import(text); 
         window.closeReplayModal();
         updateReplayUI();
     }
   });
};

window.pauseReplay = function() {
    if(window.game_manager && window.game_manager.pause) window.game_manager.pause();
    updateReplayUI();
};

var isScrubbing = false;

window.toggleReplayPause = function() {
    if(window.game_manager) {
        if(window.game_manager.isPaused) window.game_manager.resume();
        else window.game_manager.pause();
        updateReplayUI();
    }
};

window.stepReplay = function(delta) {
    if(window.game_manager) {
        window.game_manager.step(delta);
        updateReplayUI();
    }
};

window.setReplaySpeed = function(val) {
    if(window.game_manager && window.game_manager.setSpeed) {
        window.game_manager.setSpeed(parseFloat(val));
    }
};

window.seekReplay = function(val) {
    if(window.game_manager) {
        // Map slider value (0-100) to actual moves
        var total = window.game_manager.replayMoves ? window.game_manager.replayMoves.length : 0;
        var index = Math.floor((val / 100) * total);
        window.game_manager.seek(index);
        updateReplayUI();
    }
};

function updateReplayUI() {
    var game_manager = window.game_manager;
    if(!game_manager) return;
    
    var btn = document.getElementById('replay-pause-btn');
    if(btn) {
        btn.textContent = game_manager.isPaused ? "▶ 播放" : "⏯ 暂停";
    }
    
    var progress = document.getElementById('replay-progress');
    if(progress && game_manager.replayMoves && !isScrubbing) {
        var total = game_manager.replayMoves.length;
        var current = game_manager.replayIndex;
        var percent = total > 0 ? (current / total) * 100 : 0;
        progress.value = percent;
    }
}

// Periodic UI update
setInterval(updateReplayUI, 200);

// Initialize Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    // Scrubbing events
    var progressEl = document.getElementById('replay-progress');
    if(progressEl) {
        progressEl.addEventListener('mousedown', function() { isScrubbing = true; });
        progressEl.addEventListener('mouseup', function() { isScrubbing = false; });
        progressEl.addEventListener('touchstart', function() { isScrubbing = true; });
        progressEl.addEventListener('touchend', function() { isScrubbing = false; });
        progressEl.addEventListener('input', function() { window.seekReplay(this.value); });
    }

    // Replay Buttons
    var controlBtns = document.querySelectorAll('.replay-control-btn');
    // We need to distinguish them. Since I can't easily add IDs to all of them right now without extensive HTML edit, 
    // I will rely on the onclicks in HTML for a moment OR I will replace them.
    // The plan said "Remove onclick attributes".
    // So I MUST attach listeners here by ID or Class+Logic.
    
    // Let's Add IDs in the HTML step next, and then here we can bind them.
    // For now, I will define global functions that the event listeners can call if I miss some,
    // BUT the goal is to have NO inline JS.
    
    // I will assume I will add IDs:
    // btn-rewind-10, btn-rewind-1, btn-pause, btn-forward-1, btn-forward-10
    
    var btnRewind10 = document.getElementById('btn-rewind-10');
    if(btnRewind10) btnRewind10.addEventListener('click', function() { stepReplay(-10); });

    var btnRewind1 = document.getElementById('btn-rewind-1');
    if(btnRewind1) btnRewind1.addEventListener('click', function() { stepReplay(-1); });

    var btnPause = document.getElementById('replay-pause-btn'); // This ID already exists!
    if(btnPause) btnPause.addEventListener('click', toggleReplayPause);

    var btnForward1 = document.getElementById('btn-forward-1');
    if(btnForward1) btnForward1.addEventListener('click', function() { stepReplay(1); });

    var btnForward10 = document.getElementById('btn-forward-10');
    if(btnForward10) btnForward10.addEventListener('click', function() { stepReplay(10); });
    
    var speedSelect = document.getElementById('replay-speed');
    if(speedSelect) speedSelect.addEventListener('change', function() { setReplaySpeed(this.value); });
    
    var importBtn = document.querySelector('.import-replay-button');
    if(importBtn) importBtn.addEventListener('click', importReplay);
    
    var modalActionBtn = document.getElementById('replay-action-btn');
    // This is handled in showReplayModal but we can also bind closing there.
    
    var modalCloseBtn = document.querySelector('#replay-modal .replay-modal-actions button:last-child');
    if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeReplayModal);
});
