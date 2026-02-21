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

  function setupChallengeModeIntro(modeConfig) {
    var introBtn = document.getElementById("top-mode-intro-btn");
    var modal = document.getElementById("mode-intro-modal");
    var closeBtn = document.getElementById("mode-intro-close-btn");
    var title = document.getElementById("mode-intro-title");
    var desc = document.getElementById("mode-intro-desc");
    var leaderboard = document.getElementById("mode-intro-leaderboard");
    if (!introBtn || !modal || !closeBtn || !title || !desc) return;

    // Temporary: hide mode intro entry for all modes.
    introBtn.style.setProperty("display", "none", "important");
    modal.style.display = "none";
    return;

    var is64CappedMode = !!(modeConfig && modeConfig.key === "capped_4x4_pow2_64_no_undo");
    introBtn.style.setProperty("display", is64CappedMode ? "inline-flex" : "none", "important");

    if (!is64CappedMode) {
      modal.style.display = "none";
      return;
    }

    title.textContent = "64封顶模式简介";
    desc.textContent =
      "64封顶是短局冲刺模式。\n" +
      "目标是尽快合成 64，合成后本局结束并计入该模式榜单。\n" +
      "建议优先保持大数在角落，减少无效横跳，提升稳定性。";
    if (leaderboard) {
      leaderboard.textContent = "榜单功能即将上线，这里将展示 64 封顶模式排行榜。";
    }

    if (!introBtn.__modeIntroBound) {
      introBtn.__modeIntroBound = true;
      introBtn.addEventListener("click", function (e) {
        if (e) e.preventDefault();
        modal.style.display = "flex";
      });
    }
    if (!closeBtn.__modeIntroBound) {
      closeBtn.__modeIntroBound = true;
      closeBtn.addEventListener("click", function (e) {
        if (e) e.preventDefault();
        modal.style.display = "none";
      });
    }
    if (!modal.__modeIntroBound) {
      modal.__modeIntroBound = true;
      modal.addEventListener("click", function (e) {
        if (e && e.target === modal) modal.style.display = "none";
      });
    }
  }

  function setupHeader(modeConfig) {
    var title = document.getElementById("play-mode-title");
    var intro = document.getElementById("play-mode-intro");
    var body = document.body;

    if (body) {
      body.setAttribute("data-mode-id", modeConfig.key);
      body.setAttribute("data-ruleset", modeConfig.ruleset);
    }

    if (title) {
      title.textContent = modeConfig.label;
      title.style.display = "";
    }
    if (intro) {
      var modeText = compactModeLabel(modeConfig);
      var boardText = modeConfig.board_width + "x" + modeConfig.board_height;
      var rulesText = (modeConfig.ruleset === "fibonacci" ? "Fib" : "2幂");
      intro.textContent =
        modeText + "｜" + boardText + "｜" + rulesText;
      intro.style.display = "";
    }
    setupChallengeModeIntro(modeConfig);
  }

  window.requestAnimationFrame(function () {
    var modeKey = parseModeKey();
    var challengeId = parseChallengeId();
    var modeConfig = (window.ModeCatalog && window.ModeCatalog.getMode(modeKey)) ||
      (window.ModeCatalog && window.ModeCatalog.getMode("standard_4x4_pow2_no_undo"));

    if (!modeConfig) {
      alert("无效模式，已回退到标准模式");
      window.location.href = "play.html?mode_key=standard_4x4_pow2_no_undo";
      return;
    }

    window.GAME_MODE_CONFIG = modeConfig;
    window.GAME_CHALLENGE_CONTEXT = challengeId ? { id: challengeId, mode_key: modeConfig.key } : null;
    setupHeader(modeConfig);

    var gm = new GameManager(modeConfig.board_width, KeyboardInputManager, HTMLActuator, LocalScoreManager);
    window.game_manager = gm;
  });
})();
