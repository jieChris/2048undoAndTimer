(function () {
  var timerScrollOffset = 0;
  var TIMER_MAX_VISIBLE = 11;

  function isCappedMode() {
    if (typeof document === "undefined" || !document.body) return false;
    var modeId = String(document.body.getAttribute("data-mode-id") || "");
    if (modeId.indexOf("capped") !== -1) return true;
    if (window.GAME_MODE_CONFIG && typeof window.GAME_MODE_CONFIG.key === "string") {
      return window.GAME_MODE_CONFIG.key.indexOf("capped") !== -1;
    }
    return false;
  }

  function getTimerBox() {
    return document.getElementById("timerbox");
  }

  function getAllTimerRows() {
    var timerBox = getTimerBox();
    if (!timerBox) return [];

    var rows = [];
    var fixed = timerBox.querySelectorAll("[id^='timer-row-']");
    for (var i = 0; i < fixed.length; i++) rows.push(fixed[i]);

    var container = document.getElementById("capped-timer-container");
    if (container) {
      var dynamic = container.querySelectorAll(".timer-row-item");
      for (var j = 0; j < dynamic.length; j++) rows.push(dynamic[j]);
    }
    return rows;
  }

  function isRowActive(row) {
    if (!row) return false;
    var computed = window.getComputedStyle ? window.getComputedStyle(row) : null;
    var visibility = (row.style && row.style.visibility) || (computed ? computed.visibility : "");
    return visibility !== "hidden";
  }

  function updateTimerScroll() {
    var rows = getAllTimerRows();
    var controls = document.getElementById("timer-scroll-controls");
    if (!isCappedMode() || rows.length === 0) {
      if (controls) controls.style.display = "none";
      return;
    }

    var activeRows = [];
    var i;
    for (i = 0; i < rows.length; i++) {
      if (isRowActive(rows[i])) activeRows.push(rows[i]);
    }

    var total = activeRows.length;
    var maxOffset = Math.max(0, total - TIMER_MAX_VISIBLE);
    if (timerScrollOffset > maxOffset) timerScrollOffset = maxOffset;
    if (timerScrollOffset < 0) timerScrollOffset = 0;

    for (i = 0; i < rows.length; i++) {
      var row = rows[i];
      if (!isRowActive(row)) {
        row.style.display = "";
        continue;
      }
      var idx = activeRows.indexOf(row);
      if (idx >= timerScrollOffset && idx < timerScrollOffset + TIMER_MAX_VISIBLE) {
        row.style.display = "";
      } else {
        row.style.display = "none";
      }
    }

    if (controls) {
      controls.style.display = total > TIMER_MAX_VISIBLE ? "block" : "none";
    }
  }

  function cappedTimerScroll(dir) {
    timerScrollOffset += Number(dir) || 0;
    updateTimerScroll();
  }

  function cappedTimerAutoScroll() {
    var rows = getAllTimerRows();
    if (!isCappedMode() || rows.length === 0) return;
    var total = 0;
    for (var i = 0; i < rows.length; i++) {
      if (isRowActive(rows[i])) total += 1;
    }
    if (total > TIMER_MAX_VISIBLE) {
      timerScrollOffset = total - TIMER_MAX_VISIBLE;
    }
    updateTimerScroll();
  }

  function cappedTimerReset() {
    timerScrollOffset = 0;
    updateTimerScroll();
  }

  window.updateTimerScroll = updateTimerScroll;
  window.cappedTimerScroll = cappedTimerScroll;
  window.cappedTimerAutoScroll = cappedTimerAutoScroll;
  window.cappedTimerReset = cappedTimerReset;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", updateTimerScroll);
  } else {
    updateTimerScroll();
  }
  window.addEventListener("resize", updateTimerScroll);
})();
