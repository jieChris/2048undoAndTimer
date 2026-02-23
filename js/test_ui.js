document.addEventListener("DOMContentLoaded", function () {
  var PRACTICE_TRANSFER_KEY = "practice_board_transfer_v1";
  var PRACTICE_TRANSFER_SESSION_KEY = "practice_board_transfer_session_v1";
  var gridContainer = document.getElementById("test-grid-container");
  var selectionGrid = document.getElementById("selection-grid");
  var selectedValue = null;
  var zeroCycleValues = [];
  var currentSelectionRuleset = "pow2";
  var practiceRelayoutTimer = null;
  var lastGridTouchAt = 0;
  var gridTouchStartX = 0;
  var gridTouchStartY = 0;
  var gridTouchMoved = false;
  var TOUCH_TAP_MAX_DISTANCE = 12;
  var POW2_ZERO_CYCLE_VALUES = (function () {
    var values = [0];
    for (var exp = 1; exp <= 16; exp++) {
      values.push(Math.pow(2, exp)); // 2..65536
    }
    return values;
  })();
  var FIBONACCI_VALUES = (function () {
    var values = [1, 2];
    while (values.length < 16) {
      values.push(values[values.length - 1] + values[values.length - 2]);
    }
    return values;
  })();
  var FIBONACCI_ZERO_CYCLE_VALUES = [0].concat(FIBONACCI_VALUES);
  var zeroCyclePhaseByCell = {};

  function cloneJsonSafe(value) {
    try {
      return JSON.parse(JSON.stringify(value));
    } catch (_err) {
      return null;
    }
  }

  function getCellKey(x, y) {
    return String(x) + ":" + String(y);
  }

  function getNextZeroCycleValue(x, y) {
    var key = getCellKey(x, y);
    var phase = Object.prototype.hasOwnProperty.call(zeroCyclePhaseByCell, key)
      ? zeroCyclePhaseByCell[key]
      : -1;
    phase += 1;
    if (phase >= zeroCycleValues.length) phase = 0;
    zeroCyclePhaseByCell[key] = phase;
    return zeroCycleValues[phase];
  }

  function resetZeroCycleValue(x, y) {
    var key = getCellKey(x, y);
    if (Object.prototype.hasOwnProperty.call(zeroCyclePhaseByCell, key)) {
      delete zeroCyclePhaseByCell[key];
    }
  }

  function getPracticeToken() {
    try {
      var params = new URLSearchParams(window.location.search || "");
      var token = params.get("practice_token");
      return token && token.trim() ? token.trim() : "";
    } catch (_err) {
      return "";
    }
  }

  function getPracticePayloadParam() {
    try {
      var params = new URLSearchParams(window.location.search || "");
      var payload = params.get("practice_payload");
      return payload && payload.trim() ? payload : "";
    } catch (_err) {
      return "";
    }
  }

  function getStorageByName(name) {
    try {
      return window && window[name] ? window[name] : null;
    } catch (_err) {
      return null;
    }
  }

  function readStorageItem(storage, key) {
    if (!storage || !key) return null;
    try {
      return storage.getItem(key);
    } catch (_err) {
      return null;
    }
  }

  function removeStorageItem(storage, key) {
    if (!storage || !key) return;
    try {
      storage.removeItem(key);
    } catch (_err) {}
  }

  function writeStorageItem(storage, key, value) {
    if (!storage || !key) return false;
    try {
      storage.setItem(key, value);
      return true;
    } catch (_err) {
      return false;
    }
  }

  function parsePayload(raw) {
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (_err) {
      return null;
    }
  }

  function stripPayloadFromUrl(token) {
    if (!window.history || typeof window.history.replaceState !== "function") return;
    var next = "Practice_board.html";
    var ruleset = getPracticeRulesetParam();
    if (token) {
      next += "?practice_token=" + encodeURIComponent(token);
      if (ruleset) next += "&practice_ruleset=" + encodeURIComponent(ruleset);
    } else if (ruleset) {
      next += "?practice_ruleset=" + encodeURIComponent(ruleset);
    }
    window.history.replaceState(null, "", next);
  }

  function getPracticeRulesetParam() {
    try {
      var params = new URLSearchParams(window.location.search || "");
      var raw = params.get("practice_ruleset");
      return raw === "fibonacci" ? "fibonacci" : "pow2";
    } catch (_err) {
      return "pow2";
    }
  }

  function getCurrentRuleset() {
    try {
      if (window.game_manager && typeof window.game_manager.isFibonacciMode === "function") {
        return window.game_manager.isFibonacciMode() ? "fibonacci" : "pow2";
      }
    } catch (_err) {}
    try {
      if (document.body && document.body.getAttribute("data-ruleset") === "fibonacci") return "fibonacci";
    } catch (_err2) {}
    return getPracticeRulesetParam();
  }

  function getSelectionValuesForRuleset(ruleset) {
    if (ruleset === "fibonacci") return [0].concat(FIBONACCI_VALUES);
    return [0, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768];
  }

  function isPracticeMobileViewport() {
    if (typeof window !== "undefined" && typeof window.isCompactGameViewport === "function") {
      return !!window.isCompactGameViewport();
    }
    return typeof window !== "undefined" ? window.innerWidth <= 980 : false;
  }

  function syncPracticeGestureEntryUi() {
    var scores = document.querySelector(".scores-container");
    if (!scores) return;
    var enabled = isPracticeMobileViewport();
    scores.classList.toggle("practice-gesture-entry", enabled);
    scores.classList.toggle("practice-gesture-active", enabled && selectedValue === null);
    if (enabled) {
      scores.setAttribute("title", "点击切换手势模式（不放置砖块）");
    } else {
      scores.removeAttribute("title");
    }
  }

  function setSelectedValue(value) {
    selectedValue = value;
    if (selectionGrid) {
      var tiles = selectionGrid.querySelectorAll(".selection-tile");
      for (var i = 0; i < tiles.length; i++) {
        var tile = tiles[i];
        var shouldSelect = (parseInt(tile.getAttribute("data-value"), 10) === value);
        tile.classList.toggle("selected", !!shouldSelect);
      }
    }
    syncPracticeGestureEntryUi();
  }

  function renderSelectionGrid(values, defaultValue) {
    if (!selectionGrid) return;
    selectionGrid.innerHTML = "";

    for (var i = 0; i < values.length; i++) {
      var value = values[i];
      var tile = document.createElement("div");
      tile.className = value === 0 ? "selection-tile tile-0" : ("selection-tile tile tile-" + String(value));
      tile.setAttribute("data-value", String(value));

      var inner = document.createElement("div");
      inner.className = "tile-inner";
      inner.textContent = String(value);
      tile.appendChild(inner);
      selectionGrid.appendChild(tile);
    }
    setSelectedValue(defaultValue);
  }

  function syncSelectionGridByRuleset() {
    var ruleset = getCurrentRuleset();
    currentSelectionRuleset = ruleset;
    zeroCycleValues = ruleset === "fibonacci" ? FIBONACCI_ZERO_CYCLE_VALUES.slice() : POW2_ZERO_CYCLE_VALUES.slice();
    var values = getSelectionValuesForRuleset(ruleset);
    var defaultValue = ruleset === "fibonacci" ? 1 : 2;
    zeroCyclePhaseByCell = {};
    renderSelectionGrid(values, defaultValue);
  }

  function getZeroModeGuideText() {
    if (currentSelectionRuleset === "fibonacci") {
      return "选中 0 后，点击同一格会按 0→1→2→3→5→… 循环。";
    }
    return "选中 0 后，点击同一格会按 0→2→4→…→65536 循环。";
  }

  function requestPracticeRelayout() {
    if (practiceRelayoutTimer) clearTimeout(practiceRelayoutTimer);
    practiceRelayoutTimer = setTimeout(function () {
      syncPracticeGestureEntryUi();
      var gm = window.game_manager;
      if (!gm) return;
      if (gm.actuator && typeof gm.actuator.invalidateLayoutCache === "function") {
        gm.actuator.invalidateLayoutCache();
      }
      if (typeof gm.clearTransientTileVisualState === "function") {
        gm.clearTransientTileVisualState();
      }
      if (typeof gm.actuate === "function") {
        gm.actuate();
      }
    }, 120);
  }

  function applyPracticeTransfer(retriesLeft) {
    var token = getPracticeToken();
    if (!token) return;

    if (!window.game_manager || typeof window.game_manager.restartWithBoard !== "function") {
      if (retriesLeft > 0) {
        setTimeout(function () { applyPracticeTransfer(retriesLeft - 1); }, 60);
      }
      return;
    }

    var payload = null;
    var fromKey = "";
    var localStore = getStorageByName("localStorage");
    var sessionStore = getStorageByName("sessionStorage");

    var rawLocal = readStorageItem(localStore, PRACTICE_TRANSFER_KEY);
    payload = parsePayload(rawLocal);
    if (payload && payload.token === token) {
      fromKey = "local";
    } else {
      payload = null;
    }

    if (!payload) {
      var rawSession = readStorageItem(sessionStore, PRACTICE_TRANSFER_SESSION_KEY);
      payload = parsePayload(rawSession);
      if (payload && payload.token === token) {
        fromKey = "session";
      } else {
        payload = null;
      }
    }

    if (!payload) {
      var rawParam = getPracticePayloadParam();
      payload = parsePayload(rawParam);
      if (payload && payload.token === token) {
        fromKey = "url";
      } else {
        payload = null;
      }
    }
    if (!payload) return;

    if (fromKey === "local") {
      removeStorageItem(localStore, PRACTICE_TRANSFER_KEY);
    } else if (fromKey === "session") {
      removeStorageItem(sessionStore, PRACTICE_TRANSFER_SESSION_KEY);
    } else if (fromKey === "url") {
      stripPayloadFromUrl(token);
    }

    var createdAt = Number(payload.created_at) || 0;
    if (createdAt && Math.abs(Date.now() - createdAt) > 10 * 60 * 1000) return;

    if (!Array.isArray(payload.board) || payload.board.length === 0) return;

    var board = cloneJsonSafe(payload.board) || payload.board;
    var modeConfig = (payload.mode_config && typeof payload.mode_config === "object")
      ? (cloneJsonSafe(payload.mode_config) || payload.mode_config)
      : null;

    try {
      window.game_manager.restartWithBoard(board, modeConfig, {
        setPracticeRestartBase: true,
        asReplay: false
      });
      window.game_manager.isTestMode = true;
      syncSelectionGridByRuleset();
    } catch (err) {
      console.error("Practice transfer restore failed:", err);
      alert("练习板载入盘面失败，请重试。");
    }
  }

  syncSelectionGridByRuleset();

  // Guide Logic
  (function () {
    var mobileGuide = isPracticeMobileViewport();
    var guideKey = mobileGuide ? "practice_guide_mobile_shown_v1" : "practice_guide_shown_v2";
    var guideSeenFlagName = mobileGuide ? "practice_guide_mobile_seen_v1" : "practice_guide_seen_v2";
    var guideSeenUrlParam = "practice_guide_seen";

    function hasWindowNameGuideFlag() {
      try {
        return typeof window.name === "string" && window.name.indexOf(guideSeenFlagName + "=1") !== -1;
      } catch (_err) {
        return false;
      }
    }

    function setWindowNameGuideFlag() {
      try {
        if (hasWindowNameGuideFlag()) return;
        var raw = typeof window.name === "string" ? window.name : "";
        window.name = raw ? (raw + "&" + guideSeenFlagName + "=1") : (guideSeenFlagName + "=1");
      } catch (_err) {}
    }

    function hasOpenerWindowNameGuideFlag() {
      try {
        if (!window.opener) return false;
        return typeof window.opener.name === "string" && window.opener.name.indexOf(guideSeenFlagName + "=1") !== -1;
      } catch (_err) {
        return false;
      }
    }

    function setOpenerWindowNameGuideFlag() {
      try {
        if (!window.opener) return;
        if (hasOpenerWindowNameGuideFlag()) return;
        var raw = typeof window.opener.name === "string" ? window.opener.name : "";
        window.opener.name = raw ? (raw + "&" + guideSeenFlagName + "=1") : (guideSeenFlagName + "=1");
      } catch (_err) {}
    }

    function hasGuideSeenUrlFlag() {
      try {
        var params = new URLSearchParams(window.location.search || "");
        return params.get(guideSeenUrlParam) === "1";
      } catch (_err) {
        return false;
      }
    }

    function hasCookieGuideFlag() {
      try {
        var all = document.cookie || "";
        var key = guideKey + "=1";
        return all.indexOf(key) !== -1;
      } catch (_err) {
        return false;
      }
    }

    function markGuideSeen() {
      var localStore = getStorageByName("localStorage");
      var sessionStore = getStorageByName("sessionStorage");
      writeStorageItem(localStore, guideKey, "1");
      writeStorageItem(sessionStore, guideKey, "1");
      try {
        document.cookie = guideKey + "=1; path=/; max-age=31536000; SameSite=Lax";
      } catch (_err) {}
      setWindowNameGuideFlag();
      setOpenerWindowNameGuideFlag();
    }

    var localStore = getStorageByName("localStorage");
    var sessionStore = getStorageByName("sessionStorage");
    var guideShown =
      readStorageItem(localStore, guideKey) === "1" ||
      readStorageItem(sessionStore, guideKey) === "1" ||
      hasCookieGuideFlag() ||
      hasWindowNameGuideFlag() ||
      hasOpenerWindowNameGuideFlag() ||
      hasGuideSeenUrlFlag();

    if (!guideShown) {
      var overlay = document.getElementById("guide-overlay");
      var message = document.getElementById("guide-message");
      var scoreBox = document.querySelector(".scores-container");
      var zeroTile = document.querySelector(".selection-tile.tile-0");
      var firstCell = document.querySelector(".grid-cell[data-x='0'][data-y='0']") || document.querySelector(".grid-cell");
      var steps = [];
      if (mobileGuide && scoreBox) {
        steps.push({
          target: scoreBox,
          text: "移动端：点击分数栏即可切换为置空手势，随后点击棋盘不会放置砖块。"
        });
      }
      steps.push({
        target: zeroTile,
        text: getZeroModeGuideText()
      });
      steps.push({
        target: firstCell,
        text: "点击状态按“每个格子”单独记录，一个格子的循环不影响其他格子。"
      });

      function positionMessageByTarget(targetEl) {
        if (!targetEl || !message) return;
        var rect = targetEl.getBoundingClientRect();
        var top = rect.bottom + 12;
        var left = rect.left + 8;
        var maxLeft = Math.max(8, window.innerWidth - (message.offsetWidth || 260) - 8);
        if (left > maxLeft) left = maxLeft;
        if (top > window.innerHeight - 100) {
          top = Math.max(8, rect.top - 70);
        }
        message.style.top = top + "px";
        message.style.left = left + "px";
      }

      function setStep(stepIndex) {
        for (var i = 0; i < steps.length; i++) {
          var t = steps[i].target;
          if (t && t.classList) t.classList.remove("guide-highlight");
        }
        var step = steps[stepIndex];
        if (!step || !step.target || !step.target.classList) return false;
        step.target.classList.add("guide-highlight");
        message.innerHTML = "<span id='guide-arrow'>↓</span>" + step.text;
        positionMessageByTarget(step.target);
        return true;
      }

      if (overlay && message) {
        markGuideSeen();
        overlay.style.display = "block";
        var currentStep = 0;
        if (!setStep(currentStep)) {
          overlay.style.display = "none";
          return;
        }

        function dismissGuide() {
          for (var i = 0; i < steps.length; i++) {
            var t = steps[i].target;
            if (t && t.classList) t.classList.remove("guide-highlight");
          }
          overlay.style.display = "none";
          markGuideSeen();
        }

        function nextStep() {
          currentStep += 1;
          if (!setStep(currentStep)) {
            dismissGuide();
          }
        }

        overlay.addEventListener("click", function () {
          nextStep();
        });
        for (var si = 0; si < steps.length; si++) {
          var stepTarget = steps[si].target;
          if (!stepTarget || !stepTarget.addEventListener) continue;
          stepTarget.addEventListener("click", function (e) {
            if (overlay.style.display !== "block") return;
            if (e) e.preventDefault();
            nextStep();
          });
        }
        window.addEventListener("resize", function () {
          if (overlay.style.display !== "block") return;
          if (steps[currentStep] && steps[currentStep].target) {
            positionMessageByTarget(steps[currentStep].target);
          }
        });
      }
    }
  })();

  if (window.game_manager) {
    window.game_manager.isTestMode = true;
  }

  if (selectionGrid) {
    function handleSelectionInteraction(e) {
      var target = e.target.closest(".selection-tile");
      if (target) {
        if (e && e.cancelable) e.preventDefault();
        var value = parseInt(target.getAttribute("data-value"), 10);
        if (!Number.isFinite(value)) return;
        setSelectedValue(value);
      }
    }

    selectionGrid.addEventListener("click", handleSelectionInteraction);
    selectionGrid.addEventListener("touchend", handleSelectionInteraction, { passive: false });
  }

  var scoreContainer = document.querySelector(".scores-container");
  if (scoreContainer) {
    var setGestureMode = function (e) {
      if (!isPracticeMobileViewport()) return;
      if (e && e.cancelable) e.preventDefault();
      setSelectedValue(null);
    };
    scoreContainer.addEventListener("click", setGestureMode);
    scoreContainer.addEventListener("touchend", setGestureMode, { passive: false });
  }

  if (gridContainer) {
    function resolveGridCellFromEvent(e) {
      var cell = e && e.target && e.target.closest ? e.target.closest(".grid-cell") : null;
      if (cell) return cell;

      var touch = null;
      if (e && e.changedTouches && e.changedTouches.length > 0) {
        touch = e.changedTouches[0];
      } else if (e && e.touches && e.touches.length > 0) {
        touch = e.touches[0];
      }
      if (!touch || typeof document === "undefined" || !document.elementFromPoint) return null;

      var hit = document.elementFromPoint(touch.clientX, touch.clientY);
      if (!hit || !hit.closest) return null;
      return hit.closest(".grid-cell");
    }

    function applyCustomTileToCell(cell) {
      if (!cell) return;
      var x = parseInt(cell.getAttribute("data-x"), 10);
      var y = parseInt(cell.getAttribute("data-y"), 10);
      if (!window.game_manager) return;
      if (selectedValue === null) return;

      if (selectedValue === 0) {
        var cycleValue = getNextZeroCycleValue(x, y);
        window.game_manager.insertCustomTile(x, y, cycleValue);
      } else {
        resetZeroCycleValue(x, y);
        window.game_manager.insertCustomTile(x, y, selectedValue);
      }
    }

    function handleGridInteraction(e, fromTouch, touchCanPlace) {
      if (fromTouch) {
        lastGridTouchAt = Date.now();
        if (!touchCanPlace) return;
      } else if (Date.now() - lastGridTouchAt < 450) {
        // Ignore synthetic click immediately following touchend.
        return;
      }

      var tileContainer = document.querySelector(".tile-container");
      if (tileContainer) tileContainer.style.pointerEvents = "none";
      if (e && e.cancelable) e.preventDefault();

      var cell = resolveGridCellFromEvent(e);
      applyCustomTileToCell(cell);
    }

    gridContainer.addEventListener("click", function (e) {
      handleGridInteraction(e, false, true);
    });
    gridContainer.addEventListener("touchstart", function (e) {
      if (!e || !e.touches || !e.touches.length) return;
      gridTouchMoved = false;
      gridTouchStartX = e.touches[0].clientX;
      gridTouchStartY = e.touches[0].clientY;
    }, { passive: true });
    gridContainer.addEventListener("touchmove", function (e) {
      if (!e || !e.touches || !e.touches.length) return;
      var dx = Math.abs(e.touches[0].clientX - gridTouchStartX);
      var dy = Math.abs(e.touches[0].clientY - gridTouchStartY);
      if (dx > TOUCH_TAP_MAX_DISTANCE || dy > TOUCH_TAP_MAX_DISTANCE) {
        gridTouchMoved = true;
      }
    });
    gridContainer.addEventListener("touchend", function (e) {
      handleGridInteraction(e, true, !gridTouchMoved);
      gridTouchMoved = false;
    }, { passive: false });
  }

  applyPracticeTransfer(30);

  setTimeout(function () {
    if (window.game_manager) {
      window.game_manager.isTestMode = true;
    }
  }, 100);

  if (!window.__practiceRelayoutBound) {
    window.__practiceRelayoutBound = true;
    window.addEventListener("resize", requestPracticeRelayout);
    window.addEventListener("orientationchange", requestPracticeRelayout);
  }
  syncPracticeGestureEntryUi();
  requestPracticeRelayout();
});
