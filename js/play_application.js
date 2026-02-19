(function () {
  function parseModeKey() {
    var params = new URLSearchParams(window.location.search);
    var raw = params.get("mode_key");
    var key = raw && raw.trim() ? raw.trim() : "standard_4x4_pow2_no_undo";
    if (key.toLowerCase() === "challenge") {
      return "capped_4x4_pow2_64_no_undo";
    }
    return key;
  }

  function isChallengeAliasRequest() {
    var params = new URLSearchParams(window.location.search);
    var raw = params.get("mode_key");
    return !!(raw && raw.trim() && raw.trim().toLowerCase() === "challenge");
  }

  function parseChallengeId() {
    var params = new URLSearchParams(window.location.search);
    var v = params.get("challenge_id");
    return v && v.trim() ? v.trim() : "";
  }

  function compactModeLabel(modeConfig) {
    var raw = modeConfig && (modeConfig.label || modeConfig.key) ? (modeConfig.label || modeConfig.key) : "模式";
    return raw
      .replace(/（可撤回）|（无撤回）/g, "")
      .replace(/标准版/g, "标准")
      .replace(/经典版/g, "经典")
      .replace(/封顶版/g, "封顶")
      .replace(/Fibonacci/gi, "Fib")
      .replace(/（Legacy）/g, "")
      .replace(/\s+/g, "");
  }

  function setupHeader(modeConfig) {
    var title = document.getElementById("play-mode-title");
    var intro = document.getElementById("play-mode-intro");
    var body = document.body;
    var isChallengeMode = modeConfig && modeConfig.key === "capped_4x4_pow2_64_no_undo";

    if (body) {
      body.setAttribute("data-mode-id", modeConfig.key);
      body.setAttribute("data-ruleset", modeConfig.ruleset);
    }

    if (title) {
      title.textContent = isChallengeMode ? "新春快乐，马年大吉！" : modeConfig.label;
      title.style.display = "";
    }
    if (intro) {
      if (isChallengeMode) {
        intro.textContent = "挑战模式自有惊喜";
      } else {
        var modeText = compactModeLabel(modeConfig);
        var boardText = modeConfig.board_width + "x" + modeConfig.board_height;
        var rulesText = (modeConfig.ruleset === "fibonacci" ? "Fib" : "2幂");
        intro.textContent =
          modeText + "｜" + boardText + "｜" + rulesText;
      }
      intro.style.display = "";
    }
  }

  window.requestAnimationFrame(function () {
    var modeKey = parseModeKey();
    var fromChallengeAlias = isChallengeAliasRequest();
    var challengeId = parseChallengeId();
    var modeConfig = (window.ModeCatalog && window.ModeCatalog.getMode(modeKey)) ||
      (window.ModeCatalog && window.ModeCatalog.getMode("standard_4x4_pow2_no_undo"));

    if (!modeConfig) {
      alert("无效模式，已回退到标准模式");
      window.location.href = "play.html?mode_key=standard_4x4_pow2_no_undo";
      return;
    }

    if (fromChallengeAlias && window.ThemeManager && typeof window.ThemeManager.applyTheme === "function") {
      window.ThemeManager.applyTheme("horse_year");
    }

    window.GAME_MODE_CONFIG = modeConfig;
    window.GAME_CHALLENGE_CONTEXT = challengeId ? { id: challengeId, mode_key: modeConfig.key } : null;
    setupHeader(modeConfig);

    var gm = new GameManager(modeConfig.board_width, KeyboardInputManager, HTMLActuator, LocalScoreManager);
    window.game_manager = gm;
  });
})();
