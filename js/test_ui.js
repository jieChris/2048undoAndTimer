document.addEventListener('DOMContentLoaded', function() {
    var gridContainer = document.getElementById('test-grid-container');
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
