(function () {
  function parseModeKey() {
    var params = new URLSearchParams(window.location.search);
    return params.get("mode_key") || "classic_4x4_pow2_undo";
  }

  function setupHeader(modeConfig) {
    var title = document.getElementById("play-mode-title");
    var intro = document.getElementById("play-mode-intro");
    var body = document.body;

    if (body) {
      body.setAttribute("data-mode-id", modeConfig.key);
      body.setAttribute("data-ruleset", modeConfig.ruleset);
    }

    if (title) title.textContent = modeConfig.label;
    if (intro) {
      intro.textContent =
        "模式：" + modeConfig.label +
        " ｜ 棋盘：" + modeConfig.board_width + "x" + modeConfig.board_height +
        " ｜ 规则：" + (modeConfig.ruleset === "fibonacci" ? "Fibonacci" : "2 幂");
    }
  }

  window.requestAnimationFrame(function () {
    var modeKey = parseModeKey();
    var modeConfig = (window.ModeCatalog && window.ModeCatalog.getMode(modeKey)) ||
      (window.ModeCatalog && window.ModeCatalog.getMode("standard_4x4_pow2_no_undo"));

    if (!modeConfig) {
      alert("无效模式，已回退到标准模式");
      window.location.href = "play.html?mode_key=standard_4x4_pow2_no_undo";
      return;
    }

    window.GAME_MODE_CONFIG = modeConfig;
    setupHeader(modeConfig);

    var gm = new GameManager(modeConfig.board_width, KeyboardInputManager, HTMLActuator, LocalScoreManager);
    window.game_manager = gm;
  });
})();
