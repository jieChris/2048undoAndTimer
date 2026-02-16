// Entry point for the capped 2048 mode
// Max tile is 2048: two 2048 tiles cannot merge further.
// No undo functionality.
window.requestAnimationFrame(function () {
  var gm = new GameManager(4, CappedInputManager, HTMLActuator, LocalScoreManager);
  gm.maxTile = 2048;
  window.game_manager = gm;
});
