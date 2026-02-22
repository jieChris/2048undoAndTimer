(function () {
  var CUSTOM_SPAWN_MODE_KEYS = {
    spawn_custom_4x4_pow2_no_undo: true,
    spawn_custom_4x4_pow2_undo: true
  };
  var CUSTOM_FOUR_RATE_PARAM = "four_rate";
  var CUSTOM_FOUR_RATE_STORAGE_KEY = "custom_spawn_4x4_four_rate_v1";

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

  function isCustomSpawnModeKey(modeKey) {
    return !!CUSTOM_SPAWN_MODE_KEYS[String(modeKey || "")];
  }

  function sanitizeCustomFourRate(raw) {
    if (raw === null || typeof raw === "undefined") return null;
    var text = String(raw).trim().replace(/%/g, "");
    if (!text) return null;
    var num = Number(text);
    if (!Number.isFinite(num)) return null;
    if (num < 0 || num > 100) return null;
    return Math.round(num * 100) / 100;
  }

  function formatRatePercent(rate) {
    var fixed = Number(rate).toFixed(2);
    return fixed.replace(/\.?0+$/, "");
  }

  function inferFourRateFromModeConfig(modeConfig) {
    if (!modeConfig || !Array.isArray(modeConfig.spawn_table)) return 10;
    var totalWeight = 0;
    var fourWeight = 0;
    for (var i = 0; i < modeConfig.spawn_table.length; i++) {
      var item = modeConfig.spawn_table[i];
      if (!item || !Number.isFinite(item.weight) || item.weight <= 0) continue;
      totalWeight += Number(item.weight);
      if (Number(item.value) === 4) {
        fourWeight += Number(item.weight);
      }
    }
    if (totalWeight <= 0) return 10;
    return Math.round((fourWeight / totalWeight) * 10000) / 100;
  }

  function readStoredCustomFourRate() {
    try {
      return sanitizeCustomFourRate(localStorage.getItem(CUSTOM_FOUR_RATE_STORAGE_KEY));
    } catch (_err) {
      return null;
    }
  }

  function writeStoredCustomFourRate(rate) {
    try {
      localStorage.setItem(CUSTOM_FOUR_RATE_STORAGE_KEY, String(formatRatePercent(rate)));
    } catch (_err) {}
  }

  function promptCustomFourRate(defaultRate) {
    while (true) {
      var raw = window.prompt("请输入 4 率（0-100，可输入小数）", String(formatRatePercent(defaultRate)));
      if (raw === null) return null;
      var parsed = sanitizeCustomFourRate(raw);
      if (parsed !== null) return parsed;
      window.alert("输入无效，请输入 0 到 100 的数字。");
    }
  }

  function resolveCustomSpawnModeConfig(modeKey, modeConfig) {
    if (!isCustomSpawnModeKey(modeKey) || !modeConfig) return modeConfig;

    var params = new URLSearchParams(window.location.search);
    var parsedRate = sanitizeCustomFourRate(params.get(CUSTOM_FOUR_RATE_PARAM));
    if (parsedRate === null) {
      var remembered = readStoredCustomFourRate();
      var defaultRate = remembered !== null ? remembered : inferFourRateFromModeConfig(modeConfig);
      parsedRate = promptCustomFourRate(defaultRate);
      if (parsedRate === null) return null;
      params.set("mode_key", modeKey);
      params.set(CUSTOM_FOUR_RATE_PARAM, formatRatePercent(parsedRate));
      var nextUrl = window.location.pathname + "?" + params.toString() + (window.location.hash || "");
      try {
        window.history.replaceState(null, "", nextUrl);
      } catch (_err) {}
    }

    writeStoredCustomFourRate(parsedRate);

    var nextConfig = JSON.parse(JSON.stringify(modeConfig));
    var twoRate = Math.round((100 - parsedRate) * 100) / 100;
    var spawnTable = [];
    if (twoRate > 0) spawnTable.push({ value: 2, weight: twoRate });
    if (parsedRate > 0) spawnTable.push({ value: 4, weight: parsedRate });
    if (!spawnTable.length) spawnTable.push({ value: 2, weight: 100 });

    nextConfig.spawn_table = spawnTable;
    nextConfig.special_rules = (nextConfig.special_rules && typeof nextConfig.special_rules === "object")
      ? nextConfig.special_rules
      : {};
    nextConfig.special_rules.custom_spawn_four_rate = parsedRate;
    nextConfig.label = modeConfig.label + "（4率 " + formatRatePercent(parsedRate) + "%）";
    return nextConfig;
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

    modeConfig = resolveCustomSpawnModeConfig(modeKey, modeConfig);
    if (!modeConfig) {
      window.location.href = "modes.html";
      return;
    }

    window.GAME_MODE_CONFIG = modeConfig;
    window.GAME_CHALLENGE_CONTEXT = challengeId ? { id: challengeId, mode_key: modeConfig.key } : null;
    setupHeader(modeConfig);

    var gm = new GameManager(modeConfig.board_width, KeyboardInputManager, HTMLActuator, LocalScoreManager);
    window.game_manager = gm;
  });
})();
