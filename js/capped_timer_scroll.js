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

    // Collect rows in real DOM order to keep scroll window aligned
    // with what users actually see on screen.
    var rows = [];
    var seen = [];
    var all = timerBox.querySelectorAll("[id^='timer-row-'], #capped-timer-container .timer-row-item, #capped-timer-overflow-container .timer-row-item");
    for (var i = 0; i < all.length; i++) {
      var row = all[i];
      if (seen.indexOf(row) !== -1) continue;
      seen.push(row);
      rows.push(row);
    }
    return rows;
  }

  function isRowActive(row) {
    if (!row) return false;
    var computed = window.getComputedStyle ? window.getComputedStyle(row) : null;
    var visibility = (row.style && row.style.visibility) || (computed ? computed.visibility : "");
    return visibility !== "hidden";
  }

  function getRowLabelText(row) {
    if (!row) return "";
    var label = row.querySelector(".timertile");
    if (!label) return "";
    return String(label.textContent || "").trim().toLowerCase();
  }

  function getRowSortKey(row, fallbackIndex) {
    var repeatAttr = row && row.getAttribute ? parseInt(row.getAttribute("data-capped-repeat"), 10) : NaN;
    if (Number.isFinite(repeatAttr) && repeatAttr >= 2) {
      return 100000 + repeatAttr;
    }

    if (row && row.id) {
      var rowIdMatch = row.id.match(/^timer-row-(\d+)$/);
      if (rowIdMatch) {
        var rowValue = parseInt(rowIdMatch[1], 10);
        if (Number.isFinite(rowValue)) return rowValue;
      }
    }

    var text = getRowLabelText(row);
    var repeat = text.match(/^x(\d+)$/);
    if (repeat) {
      return 100000 + Number(repeat[1] || 0);
    }
    var numeric = parseInt(text, 10);
    if (Number.isFinite(numeric)) {
      return numeric;
    }
    return 200000 + fallbackIndex;
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

    activeRows.sort(function (a, b) {
      var ai = rows.indexOf(a);
      var bi = rows.indexOf(b);
      if (ai < 0) ai = 0;
      if (bi < 0) bi = 0;
      var ka = getRowSortKey(a, ai);
      var kb = getRowSortKey(b, bi);
      if (ka !== kb) return ka - kb;
      return ai - bi;
    });

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

  function bindScrollControlEvents() {
    var controls = document.getElementById("timer-scroll-controls");
    if (!controls) return;
    var buttons = controls.querySelectorAll(".timer-scroll-btn[data-scroll-dir]");
    for (var i = 0; i < buttons.length; i++) {
      var btn = buttons[i];
      if (btn.getAttribute("data-scroll-bound") === "1") continue;
      btn.setAttribute("data-scroll-bound", "1");
      btn.addEventListener("click", function (event) {
        event.preventDefault();
        var rawDir = this.getAttribute("data-scroll-dir");
        var dir = Number(rawDir);
        cappedTimerScroll(Number.isFinite(dir) ? dir : 0);
      });
    }
  }

  window.updateTimerScroll = updateTimerScroll;
  window.cappedTimerScroll = cappedTimerScroll;
  window.cappedTimerAutoScroll = cappedTimerAutoScroll;
  window.cappedTimerReset = cappedTimerReset;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      bindScrollControlEvents();
      updateTimerScroll();
    });
  } else {
    bindScrollControlEvents();
    updateTimerScroll();
  }
  bindScrollControlEvents();
  window.addEventListener("resize", updateTimerScroll);
})();
