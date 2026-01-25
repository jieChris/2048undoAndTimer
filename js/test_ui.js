document.addEventListener('DOMContentLoaded', function() {
    var gridContainer = document.getElementById('test-grid-container');
   // test_ui.js

// Guide Logic
(function() {
    var guideKey = 'practice_guide_shown_v1';
    if (!localStorage.getItem(guideKey)) {
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

    var selectionGrid = document.getElementById('selection-grid');
    
    // Default value
    var selectedValue = 2;
    
    // Enable Test Mode in GameManager if it exists
    if (window.game_manager) {
        window.game_manager.isTestMode = true;
    }
    
    // Selection Grid Logic
    if (selectionGrid) {
        selectionGrid.addEventListener('click', function(e) {
            var target = e.target.closest('.selection-tile');
            if (target) {
                // Update Value
                selectedValue = parseInt(target.getAttribute('data-value'));
                
                // Update UI: Remove .selected from all, add to target
                var tiles = selectionGrid.querySelectorAll('.selection-tile');
                for (var i = 0; i < tiles.length; i++) {
                    tiles[i].classList.remove('selected');
                }
                target.classList.add('selected');
            }
        });
    }
    
    // Bind Grid Clicks
    if (gridContainer) {
        gridContainer.addEventListener('click', function(e) {
            // Ensure proper layering handling
            var tileContainer = document.querySelector('.tile-container');
            if (tileContainer) {
                tileContainer.style.pointerEvents = 'none';
            }
            
            var target = e.target;
            if (target.classList.contains('grid-cell')) {
                var x = parseInt(target.getAttribute('data-x'));
                var y = parseInt(target.getAttribute('data-y'));
                var value = selectedValue;
                
                if (window.game_manager) {
                    window.game_manager.insertCustomTile(x, y, value);
                }
            }
        });
    }
    
    // Ensure GameManager knows it's test mode on start
    setTimeout(function() {
        if (window.game_manager) {
            window.game_manager.isTestMode = true;
        }
    }, 100);
});
