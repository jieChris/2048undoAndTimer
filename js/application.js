window.requestAnimationFrame(function () {
  var modeKey = "standard_4x4_pow2_no_undo";
  if (typeof document !== "undefined" && document.body) {
    modeKey = document.body.getAttribute("data-mode-id") || modeKey;
  }

  if (window.ModeCatalog && typeof window.ModeCatalog.getMode === "function") {
    window.GAME_MODE_CONFIG = window.ModeCatalog.getMode(modeKey) ||
      window.ModeCatalog.getMode("standard_4x4_pow2_no_undo");
  }

  var boardWidth = window.GAME_MODE_CONFIG && window.GAME_MODE_CONFIG.board_width
    ? window.GAME_MODE_CONFIG.board_width
    : 4;

  game_manager = new GameManager(boardWidth, KeyboardInputManager, HTMLActuator, LocalScoreManager);
  window.game_manager = game_manager;
});

function handle_undo() {
  if (window.game_manager && window.game_manager.isUndoInteractionEnabled && window.game_manager.isUndoInteractionEnabled()) {
    window.game_manager.move(-1);
  }
}
