window.requestAnimationFrame(function () {
  if (window.ModeCatalog && typeof window.ModeCatalog.getMode === "function") {
    window.GAME_MODE_CONFIG = window.ModeCatalog.getMode("standard_4x4_pow2_no_undo");
  }

  var boardWidth = window.GAME_MODE_CONFIG && window.GAME_MODE_CONFIG.board_width
    ? window.GAME_MODE_CONFIG.board_width
    : 4;

  window.game_manager = new GameManager(boardWidth, ReplayInputManager, HTMLActuator, LocalScoreManager);
  window.game_manager.disableSessionSync = true;
});
