window.requestAnimationFrame(function () {
  var modeKey = "standard_4x4_pow2_no_undo";
  function readPracticeRulesetParam() {
    try {
      var params = new URLSearchParams(window.location.search || "");
      var raw = params.get("practice_ruleset");
      return raw === "fibonacci" ? "fibonacci" : "pow2";
    } catch (_err) {
      return "pow2";
    }
  }

  function buildPracticeModeConfig(baseConfig, ruleset) {
    var cfg = {};
    var key;
    for (key in baseConfig) {
      if (Object.prototype.hasOwnProperty.call(baseConfig, key)) {
        cfg[key] = baseConfig[key];
      }
    }
    cfg.ruleset = ruleset === "fibonacci" ? "fibonacci" : "pow2";
    cfg.mode_family = cfg.ruleset === "fibonacci" ? "fibonacci" : "pow2";
    cfg.spawn_table = cfg.ruleset === "fibonacci"
      ? [{ value: 1, weight: 90 }, { value: 2, weight: 10 }]
      : [{ value: 2, weight: 90 }, { value: 4, weight: 10 }];
    return cfg;
  }

  if (typeof document !== "undefined" && document.body) {
    modeKey = document.body.getAttribute("data-mode-id") || modeKey;
  }

  if (window.ModeCatalog && typeof window.ModeCatalog.getMode === "function") {
    window.GAME_MODE_CONFIG = window.ModeCatalog.getMode(modeKey) ||
      window.ModeCatalog.getMode("standard_4x4_pow2_no_undo");

    if (modeKey === "practice_legacy" && window.GAME_MODE_CONFIG) {
      window.GAME_MODE_CONFIG = buildPracticeModeConfig(window.GAME_MODE_CONFIG, readPracticeRulesetParam());
    }
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
