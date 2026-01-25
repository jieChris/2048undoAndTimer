document.addEventListener('DOMContentLoaded', function() {
    var gridContainer = document.getElementById('test-grid-container');
    var selectEl = document.getElementById('test-tile-value');
    
    // Enable Test Mode in GameManager if it exists
    if (window.game_manager) {
        window.game_manager.isTestMode = true;
    }
    
    // Bind Grid Clicks
    if (gridContainer) {
        gridContainer.addEventListener('click', function(e) {
            // Find coordinates
            // Note: The click might be on a .grid-cell or deeper?
            // Actually the grid-cell is at the bottom layer.
            // The .tile-container is ABOVE it.
            // Clicks on tiles might intercept clicks on cells?
            // .tile-container usually has pointer-events: none? No, it contains tiles.
            // Tiles might block clicks.
            // If we click a tile, we might want to replace it? Or refuse?
            // For now, let's assume we click "cells".
            
            // To make sure we capture clicks through the tile container, we might need CSS `pointer-events: none` on tile-container?
            // But then we can't inspect tiles? (Not needed for this game).
            // Let's rely on coordinate calculation if possible, or bind to grid cells and ensure z-index.
            // Actually, simply adding click listener to the container and calculating x/y from offset might be robust.
            // But let's try the data attribute approach first. 
            // PROBLEM: .tile-container covers the grid.
            // WE MUST SET pointer-events: none on .tile-container for clicks to pass through to .grid-container's cells?
            // Let's do that in JS here for the test board.
            var tileContainer = document.querySelector('.tile-container');
            if (tileContainer) {
                tileContainer.style.pointerEvents = 'none';
            }
            
            var target = e.target;
            if (target.classList.contains('grid-cell')) {
                var x = parseInt(target.getAttribute('data-x'));
                var y = parseInt(target.getAttribute('data-y'));
                var value = parseInt(selectEl.value);
                
                if (window.game_manager) {
                    window.game_manager.insertCustomTile(x, y, value);
                }
            }
        });
    }
    
    // Ensure GameManager knows it's test mode on start
    // We hook into the window.game_manager which is created by application.js
    // application.js runs on load.
    
    // Use a small timeout to ensure gm is ready
    setTimeout(function() {
        if (window.game_manager) {
            window.game_manager.isTestMode = true;
            // Also force update timer invalidation if needed?
        }
    }, 100);
});
