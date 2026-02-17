window.requestAnimationFrame(function () {
  if (window.ModeCatalog && typeof window.ModeCatalog.getMode === "function") {
    window.GAME_MODE_CONFIG = window.ModeCatalog.getMode("capped_4x4_pow2_no_undo");
  }

  var boardWidth = window.GAME_MODE_CONFIG && window.GAME_MODE_CONFIG.board_width
    ? window.GAME_MODE_CONFIG.board_width
    : 4;

  var gm = new GameManager(boardWidth, CappedInputManager, HTMLActuator, LocalScoreManager);
  window.game_manager = gm;
});
