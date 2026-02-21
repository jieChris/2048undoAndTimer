function GameManager(size, InputManager, Actuator, ScoreManager) {
  this.size         = size; // Size of the grid
  this.width        = size;
  this.height       = size;
  this.inputManager = new InputManager;
  this.scoreManager = new ScoreManager;
  this.actuator     = new Actuator;
  this.timerContainer = document.querySelector(".timer-container") || document.getElementById("timer");
  this.cornerRateEl = null;
  this.cornerIpsEl = null;

  this.startTiles   = 2;
  this.maxTile      = Infinity;
  this.mode = this.detectMode();
  this.modeConfig = null;
  this.ruleset = "pow2";
  this.spawnTable = [{ value: 2, weight: 90 }, { value: 4, weight: 10 }];
  this.rankedBucket = "none";
  this.disableSessionSync = false;
  this.sessionSubmitDone = false;
  this.sessionReplayV3 = null;
  this.timerModuleView = "timer";
  this.timerLeaderboardLoadId = 0;
  this.timerModuleBaseHeight = 0;
  this.timerUpdateIntervalMs = 10;
  this.lastStatsPanelUpdateAt = 0;
  this.pendingMoveInput = null;
  this.moveInputFlushScheduled = false;
  this.lastMoveInputAt = 0;
  this.practiceRestartBoardMatrix = null;
  this.practiceRestartModeConfig = null;

  this.inputManager.on("move", this.handleMoveInput.bind(this));
  this.inputManager.on("restart", this.restart.bind(this));
  this.inputManager.on("keepPlaying", this.keepPlaying.bind(this));

  this.undoStack = [];
  this.initCornerStats();
  this.initStatsPanelUi();
  this.bindGameStatePersistenceEvents();

  this.setup();
}

GameManager.REPLAY128_ASCII_START = 33;   // "!"
GameManager.REPLAY128_ASCII_COUNT = 94;   // "!".."~"
GameManager.REPLAY128_EXTRA_CODES = (function () {
  var codes = [];
  var c;
  for (c = 161; c <= 172; c++) codes.push(c);
  // Skip 173 (soft hyphen) because it is visually unstable in copy/paste.
  for (c = 174; c <= 195; c++) codes.push(c);
  return codes;
})();
GameManager.REPLAY128_TOTAL = 128;
GameManager.REPLAY_V4_PREFIX = "REPLAY_v4C_";
GameManager.UNDO_SETTINGS_KEY = "settings_undo_enabled_by_mode_v1";
GameManager.STATS_PANEL_VISIBLE_KEY = "stats_panel_visible_v1";
GameManager.TIMER_MODULE_VIEW_SETTINGS_KEY = "settings_timer_module_view_by_mode_v1";
GameManager.SAVED_GAME_STATE_VERSION = 1;
GameManager.SAVED_GAME_STATE_KEY_PREFIX = "savedGameStateByMode:v1:";
GameManager.SAVED_GAME_STATE_LITE_KEY_PREFIX = "savedGameStateLiteByMode:v1:";
GameManager.SAVED_GAME_STATE_WINDOW_NAME_KEY = "__gm_saved_state_v1__";
GameManager.DEFAULT_MODE_KEY = "standard_4x4_pow2_no_undo";
GameManager.DEFAULT_MODE_CONFIG = {
  key: "standard_4x4_pow2_no_undo",
  label: "标准版 4x4（无撤回）",
  board_width: 4,
  board_height: 4,
  ruleset: "pow2",
  undo_enabled: false,
  max_tile: null,
  spawn_table: [{ value: 2, weight: 90 }, { value: 4, weight: 10 }],
  ranked_bucket: "standard",
  mode_family: "pow2",
  special_rules: {},
  rank_policy: "ranked"
};
GameManager.FALLBACK_MODE_CONFIGS = {
  standard_4x4_pow2_no_undo: GameManager.DEFAULT_MODE_CONFIG,
  classic_4x4_pow2_undo: {
    key: "classic_4x4_pow2_undo",
    label: "经典版 4x4（可撤回）",
    board_width: 4,
    board_height: 4,
    ruleset: "pow2",
    undo_enabled: true,
    max_tile: null,
    spawn_table: [{ value: 2, weight: 90 }, { value: 4, weight: 10 }],
    ranked_bucket: "classic_undo"
  },
  capped_4x4_pow2_no_undo: {
    key: "capped_4x4_pow2_no_undo",
    label: "4x4（2048，无撤回）",
    board_width: 4,
    board_height: 4,
    ruleset: "pow2",
    undo_enabled: false,
    max_tile: 2048,
    spawn_table: [{ value: 2, weight: 90 }, { value: 4, weight: 10 }],
    ranked_bucket: "capped"
  },
  capped_4x4_pow2_64_no_undo: {
    key: "capped_4x4_pow2_64_no_undo",
    label: "封顶版 4x4（64，无撤回）",
    board_width: 4,
    board_height: 4,
    ruleset: "pow2",
    undo_enabled: false,
    max_tile: 64,
    spawn_table: [{ value: 2, weight: 90 }, { value: 4, weight: 10 }],
    ranked_bucket: "none"
  },
  practice_legacy: {
    key: "practice_legacy",
    label: "练习板（Legacy）",
    board_width: 4,
    board_height: 4,
    ruleset: "pow2",
    undo_enabled: true,
    max_tile: null,
    spawn_table: [{ value: 2, weight: 90 }, { value: 4, weight: 10 }],
    ranked_bucket: "none"
  },
  board_3x3_pow2_undo: {
    key: "board_3x3_pow2_undo",
    label: "3x3（可撤回）",
    board_width: 3,
    board_height: 3,
    ruleset: "pow2",
    undo_enabled: true,
    max_tile: null,
    spawn_table: [{ value: 2, weight: 90 }, { value: 4, weight: 10 }],
    ranked_bucket: "none"
  },
  board_3x3_pow2_no_undo: {
    key: "board_3x3_pow2_no_undo",
    label: "3x3（无撤回）",
    board_width: 3,
    board_height: 3,
    ruleset: "pow2",
    undo_enabled: false,
    max_tile: null,
    spawn_table: [{ value: 2, weight: 90 }, { value: 4, weight: 10 }],
    ranked_bucket: "none"
  },
  board_3x4_pow2_undo: {
    key: "board_3x4_pow2_undo",
    label: "4x3（可撤回）",
    board_width: 4,
    board_height: 3,
    ruleset: "pow2",
    undo_enabled: true,
    max_tile: null,
    spawn_table: [{ value: 2, weight: 90 }, { value: 4, weight: 10 }],
    ranked_bucket: "none"
  },
  board_3x4_pow2_no_undo: {
    key: "board_3x4_pow2_no_undo",
    label: "4x3（无撤回）",
    board_width: 4,
    board_height: 3,
    ruleset: "pow2",
    undo_enabled: false,
    max_tile: null,
    spawn_table: [{ value: 2, weight: 90 }, { value: 4, weight: 10 }],
    ranked_bucket: "none"
  },
  board_2x4_pow2_undo: {
    key: "board_2x4_pow2_undo",
    label: "4x2（可撤回）",
    board_width: 4,
    board_height: 2,
    ruleset: "pow2",
    undo_enabled: true,
    max_tile: null,
    spawn_table: [{ value: 2, weight: 90 }, { value: 4, weight: 10 }],
    ranked_bucket: "none"
  },
  board_2x4_pow2_no_undo: {
    key: "board_2x4_pow2_no_undo",
    label: "4x2（无撤回）",
    board_width: 4,
    board_height: 2,
    ruleset: "pow2",
    undo_enabled: false,
    max_tile: null,
    spawn_table: [{ value: 2, weight: 90 }, { value: 4, weight: 10 }],
    ranked_bucket: "none"
  },
  fib_4x4_undo: {
    key: "fib_4x4_undo",
    label: "Fibonacci 4x4（可撤回）",
    board_width: 4,
    board_height: 4,
    ruleset: "fibonacci",
    undo_enabled: true,
    max_tile: null,
    spawn_table: [{ value: 1, weight: 90 }, { value: 2, weight: 10 }],
    ranked_bucket: "none"
  },
  fib_4x4_no_undo: {
    key: "fib_4x4_no_undo",
    label: "Fibonacci 4x4（无撤回）",
    board_width: 4,
    board_height: 4,
    ruleset: "fibonacci",
    undo_enabled: false,
    max_tile: null,
    spawn_table: [{ value: 1, weight: 90 }, { value: 2, weight: 10 }],
    ranked_bucket: "none"
  },
  fib_3x3_undo: {
    key: "fib_3x3_undo",
    label: "Fibonacci 3x3（可撤回）",
    board_width: 3,
    board_height: 3,
    ruleset: "fibonacci",
    undo_enabled: true,
    max_tile: null,
    spawn_table: [{ value: 1, weight: 90 }, { value: 2, weight: 10 }],
    ranked_bucket: "none"
  },
  fib_3x3_no_undo: {
    key: "fib_3x3_no_undo",
    label: "Fibonacci 3x3（无撤回）",
    board_width: 3,
    board_height: 3,
    ruleset: "fibonacci",
    undo_enabled: false,
    max_tile: null,
    spawn_table: [{ value: 1, weight: 90 }, { value: 2, weight: 10 }],
    ranked_bucket: "none"
  },
  spawn50_3x3_pow2_no_undo: {
    key: "spawn50_3x3_pow2_no_undo",
    label: "3x3 概率 50/50（无撤回）",
    board_width: 3,
    board_height: 3,
    ruleset: "pow2",
    undo_enabled: false,
    max_tile: null,
    spawn_table: [{ value: 2, weight: 50 }, { value: 4, weight: 50 }],
    ranked_bucket: "none"
  }
};
GameManager.LEGACY_MODE_BY_KEY = {
  standard_4x4_pow2_no_undo: "classic",
  classic_4x4_pow2_undo: "classic",
  capped_4x4_pow2_no_undo: "capped",
  practice_legacy: "practice"
};
GameManager.TIMER_SLOT_IDS = [16, 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768, 65536];

GameManager.prototype.getActionKind = function (action) {
  if (action === -1) return "u";
  if (action >= 0 && action <= 3) return "m";
  if (Array.isArray(action) && action.length > 0) return action[0];
  return "x";
};

GameManager.prototype.encodeReplay128 = function (code) {
  if (!Number.isInteger(code) || code < 0 || code >= GameManager.REPLAY128_TOTAL) {
    throw "Invalid replay code";
  }
  if (code < GameManager.REPLAY128_ASCII_COUNT) {
    return String.fromCharCode(GameManager.REPLAY128_ASCII_START + code);
  }
  return String.fromCharCode(
    GameManager.REPLAY128_EXTRA_CODES[code - GameManager.REPLAY128_ASCII_COUNT]
  );
};

GameManager.prototype.decodeReplay128 = function (char) {
  if (!char || char.length !== 1) throw "Invalid replay char";
  var code = char.charCodeAt(0);
  if (
    code >= GameManager.REPLAY128_ASCII_START &&
    code < GameManager.REPLAY128_ASCII_START + GameManager.REPLAY128_ASCII_COUNT
  ) {
    return code - GameManager.REPLAY128_ASCII_START;
  }
  var extraIndex = GameManager.REPLAY128_EXTRA_CODES.indexOf(code);
  if (extraIndex >= 0) return GameManager.REPLAY128_ASCII_COUNT + extraIndex;
  throw "Invalid replay char";
};

GameManager.prototype.encodeBoardV4 = function (board) {
  if (!Array.isArray(board) || board.length !== 4) throw "Invalid initial board";
  var out = "";
  for (var y = 0; y < 4; y++) {
    if (!Array.isArray(board[y]) || board[y].length !== 4) throw "Invalid initial board row";
    for (var x = 0; x < 4; x++) {
      var value = board[y][x];
      if (!Number.isInteger(value) || value < 0) throw "Invalid board tile value";
      var exp = 0;
      if (value > 0) {
        var lg = Math.log(value) / Math.log(2);
        if (Math.floor(lg) !== lg) throw "Board tile is not power of two";
        exp = lg;
      }
      if (exp < 0 || exp >= GameManager.REPLAY128_TOTAL) throw "Board tile exponent too large";
      out += this.encodeReplay128(exp);
    }
  }
  return out;
};

GameManager.prototype.decodeBoardV4 = function (encoded) {
  if (typeof encoded !== "string" || encoded.length !== 16) throw "Invalid encoded board";
  var rows = [];
  var idx = 0;
  for (var y = 0; y < 4; y++) {
    var row = [];
    for (var x = 0; x < 4; x++) {
      var exp = this.decodeReplay128(encoded.charAt(idx++));
      row.push(exp === 0 ? 0 : Math.pow(2, exp));
    }
    rows.push(row);
  }
  return rows;
};

GameManager.prototype.setBoardFromMatrix = function (board) {
  if (!Array.isArray(board) || board.length !== this.height) throw "Invalid board matrix";
  this.grid = new Grid(this.width, this.height);
  for (var y = 0; y < this.height; y++) {
    if (!Array.isArray(board[y]) || board[y].length !== this.width) throw "Invalid board row";
    for (var x = 0; x < this.width; x++) {
      var value = board[y][x];
      if (!Number.isInteger(value) || value < 0) throw "Invalid board value";
      if (this.isBlockedCell(x, y) && value !== 0) throw "Blocked cell must stay empty";
      if (value > 0) {
        this.grid.insertTile(new Tile({ x: x, y: y }, value));
      }
    }
  }
};

GameManager.prototype.cloneBoardMatrix = function (board) {
  var out = [];
  for (var y = 0; y < board.length; y++) {
    out.push(board[y].slice());
  }
  return out;
};

GameManager.prototype.getSavedGameStateKey = function (modeKey) {
  var key = typeof modeKey === "string" && modeKey ? modeKey : (this.modeKey || this.mode || GameManager.DEFAULT_MODE_KEY);
  return GameManager.SAVED_GAME_STATE_KEY_PREFIX + key;
};

GameManager.prototype.getSavedGameStateLiteKey = function (modeKey) {
  var key = typeof modeKey === "string" && modeKey ? modeKey : (this.modeKey || this.mode || GameManager.DEFAULT_MODE_KEY);
  return GameManager.SAVED_GAME_STATE_LITE_KEY_PREFIX + key;
};

GameManager.prototype.getWebStorageByName = function (name) {
  try {
    return (typeof window !== "undefined" && window[name]) ? window[name] : null;
  } catch (_err) {
    return null;
  }
};

GameManager.prototype.getSavedGameStateStorages = function () {
  var out = [];
  var localStore = this.getWebStorageByName("localStorage");
  var sessionStore = this.getWebStorageByName("sessionStorage");
  if (localStore) out.push(localStore);
  if (sessionStore && sessionStore !== localStore) out.push(sessionStore);
  return out;
};

GameManager.prototype.readSavedPayloadByKey = function (key) {
  var stores = this.getSavedGameStateStorages();
  var best = null;
  var bestSavedAt = -1;
  for (var i = 0; i < stores.length; i++) {
    var raw = null;
    try {
      raw = stores[i].getItem(key);
    } catch (_errRead) {
      raw = null;
    }
    if (!raw) continue;
    var parsed = null;
    try {
      parsed = JSON.parse(raw);
    } catch (_errParse) {
      try {
        stores[i].removeItem(key);
      } catch (_errRemove) {}
      continue;
    }
    if (!parsed || typeof parsed !== "object") continue;
    var savedAt = Number(parsed.saved_at) || 0;
    if (savedAt >= bestSavedAt) {
      bestSavedAt = savedAt;
      best = parsed;
    }
  }
  return best;
};

GameManager.prototype.readWindowNameSavedPayload = function (modeKey) {
  if (typeof window === "undefined") return null;
  var raw = "";
  try {
    raw = typeof window.name === "string" ? window.name : "";
  } catch (_errName) {
    return null;
  }
  if (!raw) return null;
  var marker = GameManager.SAVED_GAME_STATE_WINDOW_NAME_KEY + "=";
  var parts = raw.split("&");
  var encoded = "";
  for (var i = 0; i < parts.length; i++) {
    if (parts[i].indexOf(marker) === 0) {
      encoded = parts[i].substring(marker.length);
      break;
    }
  }
  if (!encoded) return null;
  var map = null;
  try {
    map = JSON.parse(decodeURIComponent(encoded));
  } catch (_errParse) {
    return null;
  }
  if (!map || typeof map !== "object") return null;
  var key = typeof modeKey === "string" && modeKey ? modeKey : (this.modeKey || this.mode || GameManager.DEFAULT_MODE_KEY);
  var payload = map[key];
  if (!payload || typeof payload !== "object") return null;
  return payload;
};

GameManager.prototype.writeWindowNameSavedPayload = function (modeKey, payload) {
  if (typeof window === "undefined") return false;
  var key = typeof modeKey === "string" && modeKey ? modeKey : (this.modeKey || this.mode || GameManager.DEFAULT_MODE_KEY);
  var raw = "";
  try {
    raw = typeof window.name === "string" ? window.name : "";
  } catch (_errNameRead) {
    raw = "";
  }
  var marker = GameManager.SAVED_GAME_STATE_WINDOW_NAME_KEY + "=";
  var parts = raw ? raw.split("&") : [];
  var kept = [];
  var map = {};
  for (var i = 0; i < parts.length; i++) {
    var part = parts[i];
    if (!part) continue;
    if (part.indexOf(marker) === 0) {
      var encoded = part.substring(marker.length);
      try {
        var parsed = JSON.parse(decodeURIComponent(encoded));
        if (parsed && typeof parsed === "object") map = parsed;
      } catch (_errParse) {}
      continue;
    }
    kept.push(part);
  }
  if (!payload || typeof payload !== "object") {
    delete map[key];
  } else {
    map[key] = payload;
  }
  var encodedMap = "";
  try {
    encodedMap = encodeURIComponent(JSON.stringify(map));
  } catch (_errEncode) {
    return false;
  }
  kept.push(marker + encodedMap);
  try {
    window.name = kept.join("&");
    return true;
  } catch (_errWrite) {
    return false;
  }
};

GameManager.prototype.shouldUseSavedGameState = function () {
  if (typeof window === "undefined") return false;
  if (this.replayMode) return false;
  var path = (window.location && window.location.pathname) ? String(window.location.pathname) : "";
  if (path.indexOf("replay.html") !== -1) return false;
  return true;
};

GameManager.prototype.bindGameStatePersistenceEvents = function () {
  if (typeof window === "undefined") return;
  if (this.savedGameStateBound) return;
  var self = this;
  var saveHandler = function () {
    self.saveGameState({ force: true });
  };
  window.addEventListener("beforeunload", saveHandler);
  window.addEventListener("pagehide", saveHandler);
  this.savedGameStateBound = true;
};

GameManager.prototype.clearSavedGameState = function (modeKey) {
  this.writeWindowNameSavedPayload(modeKey, null);
  if (!this.shouldUseSavedGameState()) return;
  var keys = [
    this.getSavedGameStateKey(modeKey),
    this.getSavedGameStateLiteKey(modeKey)
  ];
  var stores = this.getSavedGameStateStorages();
  for (var i = 0; i < stores.length; i++) {
    for (var k = 0; k < keys.length; k++) {
      try {
        stores[i].removeItem(keys[k]);
      } catch (_err) {}
    }
  }
};

GameManager.prototype.captureTimerFixedRowsState = function () {
  var out = {};
  for (var i = 0; i < GameManager.TIMER_SLOT_IDS.length; i++) {
    var slotId = String(GameManager.TIMER_SLOT_IDS[i]);
    var row = this.getTimerRowEl(slotId);
    var timerEl = document.getElementById("timer" + slotId);
    if (!row || !timerEl) continue;

    var legend = row.querySelector(".timertile");
    out[slotId] = {
      display: row.style.display || "",
      visibility: row.style.visibility || "",
      pointerEvents: row.style.pointerEvents || "",
      repeat: row.getAttribute("data-capped-repeat") || "",
      timerText: timerEl.textContent || "",
      legendText: legend ? (legend.textContent || "") : "",
      legendClass: legend ? (legend.className || "") : "",
      legendFontSize: legend ? (legend.style.fontSize || "") : ""
    };
  }
  return out;
};

GameManager.prototype.captureTimerDynamicRowsState = function (containerId) {
  var out = [];
  var container = document.getElementById(containerId);
  if (!container) return out;
  for (var i = 0; i < container.children.length; i++) {
    var row = container.children[i];
    if (!row || !row.classList || !row.classList.contains("timer-row-item")) continue;
    var tiles = row.querySelectorAll(".timertile");
    var legend = tiles.length > 0 ? tiles[0] : null;
    var timer = tiles.length > 1 ? tiles[1] : null;
    out.push({
      repeat: row.getAttribute("data-capped-repeat") || "",
      label: legend ? (legend.textContent || "") : "",
      labelClass: legend ? (legend.className || "") : "",
      labelFontSize: legend ? (legend.style.fontSize || "") : "",
      time: timer ? (timer.textContent || "") : ""
    });
  }
  return out;
};

GameManager.prototype.createSavedDynamicTimerRow = function (rowState) {
  var repeat = parseInt(rowState && rowState.repeat, 10);
  var labelText = rowState && typeof rowState.label === "string" ? rowState.label : "";
  var timeText = rowState && typeof rowState.time === "string" ? rowState.time : "";

  var rowDiv = document.createElement("div");
  rowDiv.className = "timer-row-item";
  if (Number.isFinite(repeat) && repeat >= 2) {
    rowDiv.setAttribute("data-capped-repeat", String(repeat));
  }

  var legend = document.createElement("div");
  legend.className = this.getCappedTimerLegendClass();
  legend.style.cssText = "color: #f9f6f2; font-size: " + this.getCappedTimerFontSize() + ";";
  legend.textContent = labelText;
  if (
    !(Number.isFinite(repeat) && repeat >= 2 && this.isCappedMode()) &&
    rowState &&
    typeof rowState.labelClass === "string" &&
    rowState.labelClass
  ) {
    legend.className = rowState.labelClass;
  }
  if (rowState && typeof rowState.labelFontSize === "string" && rowState.labelFontSize) {
    legend.style.fontSize = rowState.labelFontSize;
  }

  var val = document.createElement("div");
  val.className = "timertile";
  val.style.cssText = "margin-left:6px; width:187px;";
  val.textContent = timeText;

  rowDiv.appendChild(legend);
  rowDiv.appendChild(val);
  rowDiv.appendChild(document.createElement("br"));
  rowDiv.appendChild(document.createElement("br"));
  return rowDiv;
};

GameManager.prototype.normalizeCappedRepeatLegendClasses = function () {
  if (!this.isCappedMode() || typeof document === "undefined") return;
  var rows = document.querySelectorAll("#timerbox [data-capped-repeat]");
  var legendClass = this.getCappedTimerLegendClass();
  var fontSize = this.getCappedTimerFontSize();
  for (var i = 0; i < rows.length; i++) {
    var row = rows[i];
    if (!row || !row.querySelector) continue;
    var legend = row.querySelector(".timertile");
    if (!legend) continue;
    legend.className = legendClass;
    legend.style.color = "#f9f6f2";
    legend.style.fontSize = fontSize;
  }
  if (
    typeof window !== "undefined" &&
    window.ThemeManager &&
    typeof window.ThemeManager.syncTimerLegendStyles === "function"
  ) {
    window.ThemeManager.syncTimerLegendStyles();
  }
};

GameManager.prototype.restoreTimerRowsFromState = function (saved) {
  if (!saved || typeof saved !== "object") return;
  var fixed = saved.timer_fixed_rows;
  if (fixed && typeof fixed === "object") {
    for (var i = 0; i < GameManager.TIMER_SLOT_IDS.length; i++) {
      var slotId = String(GameManager.TIMER_SLOT_IDS[i]);
      var rowState = fixed[slotId];
      if (!rowState) continue;
      var row = this.getTimerRowEl(slotId);
      var timerEl = document.getElementById("timer" + slotId);
      if (!row || !timerEl) continue;
      var legend = row.querySelector(".timertile");

      row.style.display = typeof rowState.display === "string" ? rowState.display : "";
      row.style.visibility = typeof rowState.visibility === "string" ? rowState.visibility : "";
      row.style.pointerEvents = typeof rowState.pointerEvents === "string" ? rowState.pointerEvents : "";
      if (typeof rowState.repeat === "string" && rowState.repeat) row.setAttribute("data-capped-repeat", rowState.repeat);
      else row.removeAttribute("data-capped-repeat");

      timerEl.textContent = typeof rowState.timerText === "string" ? rowState.timerText : "";
      if (legend) {
        if (row.getAttribute("data-capped-repeat") && this.isCappedMode()) {
          legend.className = this.getCappedTimerLegendClass();
        } else if (typeof rowState.legendClass === "string" && rowState.legendClass) {
          legend.className = rowState.legendClass;
        }
        if (typeof rowState.legendText === "string") legend.textContent = rowState.legendText;
        legend.style.fontSize = typeof rowState.legendFontSize === "string" ? rowState.legendFontSize : "";
      }
    }
  }

  var capped = document.getElementById("capped-timer-container");
  if (capped) {
    capped.innerHTML = "";
    var cappedRows = Array.isArray(saved.timer_dynamic_rows_capped) ? saved.timer_dynamic_rows_capped : [];
    for (var c = 0; c < cappedRows.length; c++) {
      capped.appendChild(this.createSavedDynamicTimerRow(cappedRows[c]));
    }
  }

  var overflow = this.getCappedOverflowContainer();
  if (overflow) {
    overflow.innerHTML = "";
    var overflowRows = Array.isArray(saved.timer_dynamic_rows_overflow) ? saved.timer_dynamic_rows_overflow : [];
    for (var o = 0; o < overflowRows.length; o++) {
      overflow.appendChild(this.createSavedDynamicTimerRow(overflowRows[o]));
    }
  }

  var sub8k = document.getElementById("timer8192-sub");
  if (sub8k && typeof saved.timer_sub_8192 === "string") sub8k.textContent = saved.timer_sub_8192;
  var sub16k = document.getElementById("timer16384-sub");
  if (sub16k && typeof saved.timer_sub_16384 === "string") sub16k.textContent = saved.timer_sub_16384;
  var subContainer = document.getElementById("timer32k-sub-container");
  if (subContainer && typeof saved.timer_sub_visible === "boolean") {
    subContainer.style.display = saved.timer_sub_visible ? "block" : "none";
  }

  this.normalizeCappedRepeatLegendClasses();

  if (typeof window !== "undefined" && typeof window.updateTimerScroll === "function") {
    window.updateTimerScroll();
  }
};

GameManager.prototype.tryRestoreSavedGameState = function () {
  if (!this.shouldUseSavedGameState()) return false;
  var savedFull = this.readSavedPayloadByKey(this.getSavedGameStateKey());
  var savedLite = this.readSavedPayloadByKey(this.getSavedGameStateLiteKey());
  var savedWindow = this.readWindowNameSavedPayload(this.modeKey);
  var saved = null;
  var candidates = [savedFull, savedLite, savedWindow];
  var bestAt = -1;
  for (var c = 0; c < candidates.length; c++) {
    var item = candidates[c];
    if (!item || typeof item !== "object") continue;
    var at = Number(item.saved_at) || 0;
    if (at >= bestAt) {
      bestAt = at;
      saved = item;
    }
  }
  if (!saved) return false;

  if (!saved || typeof saved !== "object") {
    this.clearSavedGameState();
    return false;
  }
  if (Number(saved.v) !== GameManager.SAVED_GAME_STATE_VERSION) {
    this.clearSavedGameState();
    return false;
  }
  if (saved.terminated) {
    this.clearSavedGameState();
    return false;
  }
  if ((saved.over || (saved.won && !saved.keep_playing)) && saved.mode_key !== "practice_legacy") {
    this.clearSavedGameState();
    return false;
  }
  if (saved.mode_key !== this.modeKey) {
    return false;
  }
  if (Number(saved.board_width) !== this.width || Number(saved.board_height) !== this.height) {
    this.clearSavedGameState();
    return false;
  }
  if (saved.ruleset && saved.ruleset !== this.ruleset) {
    this.clearSavedGameState();
    return false;
  }
  if (!Array.isArray(saved.board) || saved.board.length !== this.height) {
    this.clearSavedGameState();
    return false;
  }

  try {
    this.setBoardFromMatrix(saved.board);
  } catch (_err3) {
    this.clearSavedGameState();
    return false;
  }

  this.score = Number.isInteger(saved.score) && saved.score >= 0 ? saved.score : 0;
  this.over = !!saved.over;
  this.won = !!saved.won;
  this.keepPlaying = !!saved.keep_playing;
  this.initialSeed = Number.isFinite(saved.initial_seed) ? Number(saved.initial_seed) : this.initialSeed;
  this.seed = Number.isFinite(saved.seed) ? Number(saved.seed) : this.initialSeed;
  this.moveHistory = Array.isArray(saved.move_history) ? saved.move_history.slice() : [];
  this.undoStack = Array.isArray(saved.undo_stack) ? saved.undo_stack.slice() : [];
  this.replayCompactLog = typeof saved.replay_compact_log === "string" ? saved.replay_compact_log : "";
  this.sessionReplayV3 = saved.session_replay_v3 && typeof saved.session_replay_v3 === "object"
    ? this.clonePlain(saved.session_replay_v3)
    : this.sessionReplayV3;
  this.spawnValueCounts = saved.spawn_value_counts && typeof saved.spawn_value_counts === "object"
    ? this.clonePlain(saved.spawn_value_counts)
    : {};
  this.spawnTwos = this.spawnValueCounts["2"] || 0;
  this.spawnFours = this.spawnValueCounts["4"] || 0;
  this.reached32k = !!saved.reached_32k;
  this.cappedMilestoneCount = Number.isInteger(saved.capped_milestone_count) ? saved.capped_milestone_count : 0;
  this.capped64Unlocked = saved.capped64_unlocked && typeof saved.capped64_unlocked === "object"
    ? this.clonePlain(saved.capped64_unlocked)
    : this.capped64Unlocked;
  this.comboStreak = Number.isInteger(saved.combo_streak) ? saved.combo_streak : 0;
  this.successfulMoveCount = Number.isInteger(saved.successful_move_count) ? saved.successful_move_count : 0;
  this.undoUsed = Number.isInteger(saved.undo_used) ? saved.undo_used : 0;
  this.lockConsumedAtMoveCount = Number.isInteger(saved.lock_consumed_at_move_count) ? saved.lock_consumed_at_move_count : -1;
  this.lockedDirectionTurn = Number.isInteger(saved.locked_direction_turn) ? saved.locked_direction_turn : null;
  this.lockedDirection = Number.isInteger(saved.locked_direction) ? saved.locked_direction : null;
  this.challengeId = typeof saved.challenge_id === "string" && saved.challenge_id ? saved.challenge_id : null;
  this.hasGameStarted = !!saved.has_game_started;
  this.accumulatedTime = Number.isFinite(saved.duration_ms) && saved.duration_ms >= 0 ? Math.floor(saved.duration_ms) : 0;
  this.time = this.accumulatedTime;
  this.startTime = null;
  this.timerStatus = 0;
  this.sessionSubmitDone = false;

  if (Array.isArray(saved.initial_board_matrix) && saved.initial_board_matrix.length === this.height) {
    this.initialBoardMatrix = this.cloneBoardMatrix(saved.initial_board_matrix);
  } else {
    this.initialBoardMatrix = this.getFinalBoardMatrix();
  }
  this.replayStartBoardMatrix = Array.isArray(saved.replay_start_board_matrix) && saved.replay_start_board_matrix.length === this.height
    ? this.cloneBoardMatrix(saved.replay_start_board_matrix)
    : this.cloneBoardMatrix(this.initialBoardMatrix);
  this.practiceRestartBoardMatrix = Array.isArray(saved.practice_restart_board_matrix) && saved.practice_restart_board_matrix.length === this.height
    ? this.cloneBoardMatrix(saved.practice_restart_board_matrix)
    : null;
  this.practiceRestartModeConfig = saved.practice_restart_mode_config && typeof saved.practice_restart_mode_config === "object"
    ? this.clonePlain(saved.practice_restart_mode_config)
    : null;

  this.restoreTimerRowsFromState(saved);
  if (saved.timer_module_view === "hidden") this.timerModuleView = "hidden";
  else this.timerModuleView = "timer";

  var timerEl = document.getElementById("timer");
  if (timerEl) timerEl.textContent = this.pretty(this.accumulatedTime);
  if (!this.over && !this.won && saved.timer_status === 1) {
    this.startTimer();
  }
  return true;
};

GameManager.prototype.saveGameState = function (options) {
  options = options || {};
  if (!this.shouldUseSavedGameState()) return;
  if (this.isSessionTerminated() && this.modeKey !== "practice_legacy") {
    this.clearSavedGameState();
    return;
  }

  var now = Date.now();
  if (!options.force && this.lastSavedGameStateAt && now - this.lastSavedGameStateAt < 150) {
    return;
  }

  var payload = {
    v: GameManager.SAVED_GAME_STATE_VERSION,
    saved_at: now,
    terminated: false,
    mode_key: this.modeKey,
    board_width: this.width,
    board_height: this.height,
    ruleset: this.ruleset,
    board: this.getFinalBoardMatrix(),
    score: this.score,
    over: this.over,
    won: this.won,
    keep_playing: this.keepPlaying,
    initial_seed: this.initialSeed,
    seed: this.seed,
    move_history: this.moveHistory ? this.moveHistory.slice() : [],
    undo_stack: this.undoStack ? this.safeClonePlain(this.undoStack, []) : [],
    replay_compact_log: this.replayCompactLog || "",
    session_replay_v3: this.sessionReplayV3 ? this.safeClonePlain(this.sessionReplayV3, null) : null,
    spawn_value_counts: this.spawnValueCounts ? this.safeClonePlain(this.spawnValueCounts, {}) : {},
    reached_32k: !!this.reached32k,
    capped_milestone_count: Number.isInteger(this.cappedMilestoneCount) ? this.cappedMilestoneCount : 0,
    capped64_unlocked: this.capped64Unlocked ? this.safeClonePlain(this.capped64Unlocked, null) : null,
    timer_status: this.timerStatus === 1 ? 1 : 0,
    duration_ms: this.getDurationMs(),
    has_game_started: !!this.hasGameStarted,
    combo_streak: Number.isInteger(this.comboStreak) ? this.comboStreak : 0,
    successful_move_count: Number.isInteger(this.successfulMoveCount) ? this.successfulMoveCount : 0,
    undo_used: Number.isInteger(this.undoUsed) ? this.undoUsed : 0,
    lock_consumed_at_move_count: Number.isInteger(this.lockConsumedAtMoveCount) ? this.lockConsumedAtMoveCount : -1,
    locked_direction_turn: Number.isInteger(this.lockedDirectionTurn) ? this.lockedDirectionTurn : null,
    locked_direction: Number.isInteger(this.lockedDirection) ? this.lockedDirection : null,
    challenge_id: this.challengeId || null,
    initial_board_matrix: this.initialBoardMatrix ? this.cloneBoardMatrix(this.initialBoardMatrix) : this.getFinalBoardMatrix(),
    replay_start_board_matrix: this.replayStartBoardMatrix ? this.cloneBoardMatrix(this.replayStartBoardMatrix) : null,
    practice_restart_board_matrix: this.practiceRestartBoardMatrix ? this.cloneBoardMatrix(this.practiceRestartBoardMatrix) : null,
    practice_restart_mode_config: this.practiceRestartModeConfig ? this.safeClonePlain(this.practiceRestartModeConfig, null) : null,
    timer_module_view: this.getTimerModuleViewMode ? this.getTimerModuleViewMode() : "timer",
    timer_fixed_rows: this.captureTimerFixedRowsState(),
    timer_dynamic_rows_capped: this.captureTimerDynamicRowsState("capped-timer-container"),
    timer_dynamic_rows_overflow: this.captureTimerDynamicRowsState("capped-timer-overflow-container"),
    timer_sub_8192: (document.getElementById("timer8192-sub") || {}).textContent || "",
    timer_sub_16384: (document.getElementById("timer16384-sub") || {}).textContent || "",
    timer_sub_visible: ((document.getElementById("timer32k-sub-container") || {}).style || {}).display === "block"
  };

  try {
    var key = this.getSavedGameStateKey();
    var liteKey = this.getSavedGameStateLiteKey();
    var litePayload = this.buildLiteSavedGameStatePayload(payload);
    this.writeWindowNameSavedPayload(this.modeKey, litePayload);
    var persisted = this.writeSavedGameStatePayload(key, payload);
    if (!persisted) {
      persisted = this.writeSavedGameStatePayload(key, litePayload);
    }
    var litePersisted = this.writeSavedGameStatePayload(liteKey, litePayload);
    if (!persisted && !litePersisted) {
      // Quota fallback: remove old snapshots for this mode, then retry a tiny snapshot.
      this.clearSavedGameState(this.modeKey);
      persisted = this.writeSavedGameStatePayload(key, litePayload);
      litePersisted = this.writeSavedGameStatePayload(liteKey, litePayload);
    }
    if (!persisted && !litePersisted) return;
    this.lastSavedGameStateAt = now;
  } catch (_err) {}
};

GameManager.prototype.appendCompactMoveCode = function (rawCode) {
  if (!Number.isInteger(rawCode) || rawCode < 0 || rawCode > 127) throw "Invalid move code";
  if (rawCode < 127) {
    this.replayCompactLog += this.encodeReplay128(rawCode);
    return;
  }
  this.replayCompactLog += this.encodeReplay128(127) + this.encodeReplay128(0);
};

GameManager.prototype.appendCompactUndo = function () {
  this.replayCompactLog += this.encodeReplay128(127) + this.encodeReplay128(1);
};

GameManager.prototype.appendCompactPracticeAction = function (x, y, value) {
  if (this.width !== 4 || this.height !== 4) throw "Compact practice replay only supports 4x4";
  if (!Number.isInteger(x) || !Number.isInteger(y) || x < 0 || x > 3 || y < 0 || y > 3) {
    throw "Invalid practice coords";
  }
  if (!Number.isInteger(value) || value < 0) throw "Invalid practice value";
  var exp = 0;
  if (value > 0) {
    var lg = Math.log(value) / Math.log(2);
    if (Math.floor(lg) !== lg) throw "Practice value must be power of two";
    exp = lg;
  }
  if (exp < 0 || exp > 127) throw "Practice value exponent too large";
  var cell = (x << 2) | y;
  this.replayCompactLog += this.encodeReplay128(127) + this.encodeReplay128(2);
  this.replayCompactLog += this.encodeReplay128(cell) + this.encodeReplay128(exp);
};

GameManager.prototype.detectMode = function () {
  if (this.mode) return this.mode;
  if (typeof document !== "undefined" && document.body) {
    var bodyMode = document.body.getAttribute("data-mode-id");
    if (bodyMode) return bodyMode;
  }
  if (typeof window === "undefined" || !window.location || !window.location.pathname) {
    return GameManager.DEFAULT_MODE_KEY;
  }
  var path = window.location.pathname;
  if (path.indexOf("undo_2048") !== -1) return "classic_4x4_pow2_undo";
  if (path.indexOf("Practice_board") !== -1) return "practice_legacy";
  if (path.indexOf("capped_2048") !== -1) return "capped_4x4_pow2_no_undo";
  if (path === "/" || /\/$/.test(path) || path.indexOf("/index.html") !== -1 || path.indexOf("index.html") !== -1) {
    return "standard_4x4_pow2_no_undo";
  }
  return "classic_4x4_pow2_undo";
};

GameManager.prototype.clonePlain = function (value) {
  return JSON.parse(JSON.stringify(value));
};

GameManager.prototype.safeClonePlain = function (value, fallback) {
  try {
    return this.clonePlain(value);
  } catch (_err) {
    return fallback;
  }
};

GameManager.prototype.writeSavedGameStatePayload = function (key, payloadObj) {
  var stores = this.getSavedGameStateStorages();
  if (!stores || stores.length === 0) return false;
  var serialized = null;
  try {
    serialized = JSON.stringify(payloadObj);
  } catch (_errJson) {
    return false;
  }
  for (var i = 0; i < stores.length; i++) {
    try {
      stores[i].setItem(key, serialized);
      return true;
    } catch (_errStore) {}
  }
  return false;
};

GameManager.prototype.buildLiteSavedGameStatePayload = function (payload) {
  if (!payload || typeof payload !== "object") return null;
  return {
    v: GameManager.SAVED_GAME_STATE_VERSION,
    saved_at: Number(payload.saved_at) || Date.now(),
    terminated: false,
    mode_key: payload.mode_key || this.modeKey,
    board_width: Number(payload.board_width) || this.width,
    board_height: Number(payload.board_height) || this.height,
    ruleset: payload.ruleset || this.ruleset,
    board: Array.isArray(payload.board) ? this.cloneBoardMatrix(payload.board) : this.getFinalBoardMatrix(),
    score: Number.isInteger(payload.score) ? payload.score : this.score,
    over: !!payload.over,
    won: !!payload.won,
    keep_playing: !!payload.keep_playing,
    initial_seed: Number.isFinite(payload.initial_seed) ? Number(payload.initial_seed) : this.initialSeed,
    seed: Number.isFinite(payload.seed) ? Number(payload.seed) : this.seed,
    timer_status: payload.timer_status === 1 ? 1 : 0,
    duration_ms: Number.isFinite(payload.duration_ms) ? Math.floor(payload.duration_ms) : this.getDurationMs(),
    has_game_started: !!payload.has_game_started,
    initial_board_matrix: Array.isArray(payload.initial_board_matrix)
      ? this.cloneBoardMatrix(payload.initial_board_matrix)
      : (this.initialBoardMatrix ? this.cloneBoardMatrix(this.initialBoardMatrix) : this.getFinalBoardMatrix()),
    replay_start_board_matrix: Array.isArray(payload.replay_start_board_matrix)
      ? this.cloneBoardMatrix(payload.replay_start_board_matrix)
      : (this.replayStartBoardMatrix ? this.cloneBoardMatrix(this.replayStartBoardMatrix) : null),
    practice_restart_board_matrix: Array.isArray(payload.practice_restart_board_matrix)
      ? this.cloneBoardMatrix(payload.practice_restart_board_matrix)
      : (this.practiceRestartBoardMatrix ? this.cloneBoardMatrix(this.practiceRestartBoardMatrix) : null),
    practice_restart_mode_config: payload.practice_restart_mode_config
      ? this.safeClonePlain(payload.practice_restart_mode_config, null)
      : (this.practiceRestartModeConfig ? this.safeClonePlain(this.practiceRestartModeConfig, null) : null),
    move_history: [],
    undo_stack: [],
    replay_compact_log: "",
    session_replay_v3: null,
    spawn_value_counts: {},
    reached_32k: !!payload.reached_32k,
    capped_milestone_count: Number.isInteger(payload.capped_milestone_count) ? payload.capped_milestone_count : 0,
    capped64_unlocked: null,
    combo_streak: Number.isInteger(payload.combo_streak) ? payload.combo_streak : 0,
    successful_move_count: Number.isInteger(payload.successful_move_count) ? payload.successful_move_count : 0,
    undo_used: Number.isInteger(payload.undo_used) ? payload.undo_used : 0,
    lock_consumed_at_move_count: Number.isInteger(payload.lock_consumed_at_move_count) ? payload.lock_consumed_at_move_count : -1,
    locked_direction_turn: Number.isInteger(payload.locked_direction_turn) ? payload.locked_direction_turn : null,
    locked_direction: Number.isInteger(payload.locked_direction) ? payload.locked_direction : null,
    challenge_id: payload.challenge_id || null
  };
};

GameManager.prototype.getModeConfigFromCatalog = function (modeKey) {
  if (typeof window !== "undefined" && window.ModeCatalog && typeof window.ModeCatalog.getMode === "function") {
    return window.ModeCatalog.getMode(modeKey);
  }
  if (GameManager.FALLBACK_MODE_CONFIGS[modeKey]) {
    return this.clonePlain(GameManager.FALLBACK_MODE_CONFIGS[modeKey]);
  }
  return null;
};

GameManager.prototype.normalizeSpawnTable = function (spawnTable, ruleset) {
  if (Array.isArray(spawnTable) && spawnTable.length > 0) {
    var out = [];
    for (var i = 0; i < spawnTable.length; i++) {
      var item = spawnTable[i];
      if (!item || !Number.isInteger(item.value) || item.value <= 0) continue;
      if (!Number.isFinite(item.weight) || item.weight <= 0) continue;
      out.push({ value: item.value, weight: Number(item.weight) });
    }
    if (out.length > 0) return out;
  }
  if (ruleset === "fibonacci") {
    return [{ value: 1, weight: 90 }, { value: 2, weight: 10 }];
  }
  return [{ value: 2, weight: 90 }, { value: 4, weight: 10 }];
};

GameManager.prototype.normalizeModeConfig = function (modeKey, rawConfig) {
  var cfg = rawConfig ? this.clonePlain(rawConfig) : this.clonePlain(GameManager.DEFAULT_MODE_CONFIG);
  cfg.key = cfg.key || modeKey || GameManager.DEFAULT_MODE_KEY;
  cfg.board_width = Number.isInteger(cfg.board_width) && cfg.board_width > 0 ? cfg.board_width : 4;
  cfg.board_height = Number.isInteger(cfg.board_height) && cfg.board_height > 0 ? cfg.board_height : cfg.board_width;
  cfg.ruleset = cfg.ruleset === "fibonacci" ? "fibonacci" : "pow2";
  cfg.undo_enabled = !!cfg.undo_enabled;
  cfg.max_tile = Number.isInteger(cfg.max_tile) && cfg.max_tile > 0 ? cfg.max_tile : null;
  cfg.spawn_table = this.normalizeSpawnTable(cfg.spawn_table, cfg.ruleset);
  cfg.ranked_bucket = cfg.ranked_bucket || "none";
  cfg.mode_family = cfg.mode_family || (cfg.ruleset === "fibonacci" ? "fibonacci" : "pow2");
  cfg.special_rules = this.normalizeSpecialRules(cfg.special_rules);
  cfg.rank_policy = cfg.rank_policy || (cfg.ranked_bucket !== "none" ? "ranked" : "unranked");
  return cfg;
};

GameManager.prototype.resolveModeConfig = function (modeId) {
  var id = modeId || GameManager.DEFAULT_MODE_KEY;
  var byCatalog = this.getModeConfigFromCatalog(id);
  if (byCatalog) return this.normalizeModeConfig(id, byCatalog);

  var legacyMap = {
    classic: "classic_4x4_pow2_undo",
    capped: "capped_4x4_pow2_no_undo",
    practice: "practice_legacy",
    classic_no_undo: "standard_4x4_pow2_no_undo",
    classic_undo_only: "classic_4x4_pow2_undo"
  };
  var mapped = legacyMap[id];
  if (mapped) {
    var mappedCfg = this.getModeConfigFromCatalog(mapped);
    if (mappedCfg) return this.normalizeModeConfig(mapped, mappedCfg);
  }
  return this.normalizeModeConfig(GameManager.DEFAULT_MODE_KEY, GameManager.DEFAULT_MODE_CONFIG);
};

GameManager.prototype.applyModeConfig = function (modeConfig) {
  var cfg = this.normalizeModeConfig(modeConfig && modeConfig.key, modeConfig);
  this.modeConfig = cfg;
  this.mode = cfg.key;
  this.modeKey = cfg.key;
  this.width = cfg.board_width;
  this.height = cfg.board_height;
  this.size = this.width;
  this.ruleset = cfg.ruleset;
  this.maxTile = cfg.max_tile || Infinity;
  this.spawnTable = this.normalizeSpawnTable(cfg.spawn_table, cfg.ruleset);
  this.rankedBucket = cfg.ranked_bucket || "none";
  this.modeFamily = cfg.mode_family || (cfg.ruleset === "fibonacci" ? "fibonacci" : "pow2");
  this.specialRules = this.normalizeSpecialRules(cfg.special_rules);
  this.rankPolicy = cfg.rank_policy || (this.rankedBucket !== "none" ? "ranked" : "unranked");
  this.applySpecialRulesState();
  if (this.scoreManager && typeof this.scoreManager.setModeKey === "function") {
    this.scoreManager.setModeKey(cfg.key);
  }
  if (typeof document !== "undefined" && document.body) {
    document.body.setAttribute("data-mode-id", cfg.key);
    document.body.setAttribute("data-ruleset", cfg.ruleset);
    document.body.setAttribute("data-mode-family", this.modeFamily);
    document.body.setAttribute("data-rank-policy", this.rankPolicy);
  }
};

GameManager.prototype.normalizeSpecialRules = function (rules) {
  if (!rules || typeof rules !== "object" || Array.isArray(rules)) return {};
  return this.clonePlain(rules);
};

GameManager.prototype.applySpecialRulesState = function () {
  var rules = this.specialRules || {};
  var blockedRaw = Array.isArray(rules.blocked_cells) ? rules.blocked_cells : [];
  this.blockedCellSet = {};
  this.blockedCellsList = [];
  for (var i = 0; i < blockedRaw.length; i++) {
    var item = blockedRaw[i];
    var x = null;
    var y = null;
    if (Array.isArray(item) && item.length >= 2) {
      x = Number(item[0]);
      y = Number(item[1]);
    } else if (item && typeof item === "object") {
      x = Number(item.x);
      y = Number(item.y);
    }
    if (!Number.isInteger(x) || !Number.isInteger(y)) continue;
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) continue;
    this.blockedCellSet[x + ":" + y] = true;
    this.blockedCellsList.push({ x: x, y: y });
  }

  this.undoLimit = Number.isInteger(rules.undo_limit) && rules.undo_limit >= 0 ? rules.undo_limit : null;
  this.comboMultiplier = Number.isFinite(rules.combo_multiplier) && rules.combo_multiplier > 1
    ? Number(rules.combo_multiplier)
    : 1;
  this.directionLockRules = rules.direction_lock && typeof rules.direction_lock === "object"
    ? this.clonePlain(rules.direction_lock)
    : null;
};

GameManager.prototype.isBlockedCell = function (x, y) {
  return !!(this.blockedCellSet && this.blockedCellSet[x + ":" + y]);
};

GameManager.prototype.getAvailableCells = function () {
  var out = [];
  for (var x = 0; x < this.width; x++) {
    for (var y = 0; y < this.height; y++) {
      if (this.isBlockedCell(x, y)) continue;
      if (this.grid.cellAvailable({ x: x, y: y })) out.push({ x: x, y: y });
    }
  }
  return out;
};

GameManager.prototype.getLockedDirection = function () {
  var rules = this.directionLockRules;
  if (!rules) return null;
  var everyK = Number(rules.every_k_moves);
  if (!Number.isInteger(everyK) || everyK <= 0) return null;
  if (this.successfulMoveCount <= 0 || this.successfulMoveCount % everyK !== 0) return null;
  if (this.lockConsumedAtMoveCount === this.successfulMoveCount) return null;
  if (this.lockedDirectionTurn !== this.successfulMoveCount) {
    var phase = Math.floor(this.successfulMoveCount / everyK);
    var rng = new Math.seedrandom(String(this.initialSeed) + ":lock:" + phase);
    this.lockedDirection = Math.floor(rng() * 4);
    this.lockedDirectionTurn = this.successfulMoveCount;
  }
  return this.lockedDirection;
};

GameManager.prototype.consumeDirectionLock = function () {
  this.lockConsumedAtMoveCount = this.successfulMoveCount;
};

GameManager.prototype.getLegacyModeFromModeKey = function (modeKey) {
  var key = modeKey || this.modeKey || this.mode;
  if (GameManager.LEGACY_MODE_BY_KEY[key]) return GameManager.LEGACY_MODE_BY_KEY[key];
  if (key && key.indexOf("capped") !== -1) return "capped";
  if (key && key.indexOf("practice") !== -1) return "practice";
  return "classic";
};

GameManager.prototype.pickSpawnValue = function () {
  var table = this.spawnTable || [];
  if (!table.length) return 2;
  var totalWeight = 0;
  var i;
  for (i = 0; i < table.length; i++) {
    totalWeight += table[i].weight;
  }
  if (totalWeight <= 0) return table[0].value;
  var pick = Math.random() * totalWeight;
  var running = 0;
  for (i = 0; i < table.length; i++) {
    running += table[i].weight;
    if (pick <= running) return table[i].value;
  }
  return table[table.length - 1].value;
};

GameManager.prototype.isFibonacciMode = function () {
  return this.ruleset === "fibonacci";
};

GameManager.prototype.nextFibonacci = function (value) {
  if (value <= 0) return 1;
  if (value === 1) return 2;
  var a = 1;
  var b = 2;
  while (b < value) {
    var n = a + b;
    a = b;
    b = n;
  }
  return b === value ? a + b : null;
};

GameManager.prototype.getMergedValue = function (a, b) {
  if (!Number.isInteger(a) || !Number.isInteger(b) || a <= 0 || b <= 0) return null;
  if (!this.isFibonacciMode()) {
    if (a !== b) return null;
    var pow2Merged = a * 2;
    if (pow2Merged > this.maxTile) return null;
    return pow2Merged;
  }
  if (a === 1 && b === 1) {
    if (2 > this.maxTile) return null;
    return 2;
  }
  var low = Math.min(a, b);
  var high = Math.max(a, b);
  var next = this.nextFibonacci(low);
  if (next !== high) return null;
  var fibMerged = low + high;
  if (fibMerged > this.maxTile) return null;
  return fibMerged;
};

GameManager.prototype.getTimerMilestoneValues = function () {
  if (this.isFibonacciMode()) {
    // 13 slots mapped to Fibonacci milestones.
    return [13, 21, 34, 55, 89, 144, 233, 377, 610, 987, 1597, 2584, 4181];
  }
  return GameManager.TIMER_SLOT_IDS.slice();
};

GameManager.prototype.configureTimerMilestones = function () {
  this.timerMilestones = this.getTimerMilestoneValues();
  this.timerMilestoneSlotByValue = {};
  for (var i = 0; i < GameManager.TIMER_SLOT_IDS.length; i++) {
    var slotId = String(GameManager.TIMER_SLOT_IDS[i]);
    var milestone = this.timerMilestones[i];
    if (Number.isInteger(milestone) && milestone > 0) {
      this.timerMilestoneSlotByValue[String(milestone)] = slotId;
    }
  }
  this.updateTimerLegendLabels();
};

GameManager.prototype.updateTimerLegendLabels = function () {
  if (typeof document === "undefined") return;
  var milestones = this.timerMilestones || this.getTimerMilestoneValues();
  for (var i = 0; i < GameManager.TIMER_SLOT_IDS.length; i++) {
    var slotId = String(GameManager.TIMER_SLOT_IDS[i]);
    var label = String(milestones[i]);
    var nodes = document.querySelectorAll(".timer-legend-" + slotId);
    for (var j = 0; j < nodes.length; j++) {
      nodes[j].textContent = label;
    }
  }
  if (typeof window !== "undefined" && window.ThemeManager && typeof window.ThemeManager.syncTimerLegendStyles === "function") {
    window.ThemeManager.syncTimerLegendStyles();
  }
};

GameManager.prototype.recordTimerMilestone = function (value, timeStr) {
  if (!Number.isInteger(value) || value <= 0) return;
  this.unlockProgressiveCapped64Row(value);
  var slotId = this.timerMilestoneSlotByValue ? this.timerMilestoneSlotByValue[String(value)] : null;
  if (!slotId) return;
  var el = document.getElementById("timer" + slotId);
  if (el && el.textContent === "") {
    el.textContent = timeStr;
  }
};

GameManager.prototype.isCappedMode = function () {
  var key = String(this.modeKey || this.mode || "");
  return key.indexOf("capped") !== -1 && Number.isFinite(this.maxTile) && this.maxTile > 0;
};

GameManager.prototype.getCappedTargetValue = function () {
  return this.isCappedMode() ? Number(this.maxTile) : null;
};

GameManager.prototype.isProgressiveCapped64Mode = function () {
  // Disable progressive hidden timer rows for 64-capped mode.
  return false;
};

GameManager.prototype.getTimerRowEl = function (value) {
  return document.getElementById("timer-row-" + String(value));
};

GameManager.prototype.setTimerRowVisibleState = function (value, visible, keepSpace) {
  var row = this.getTimerRowEl(value);
  if (!row) return;
  row.style.display = "block";
  if (visible) {
    row.style.visibility = "visible";
    row.style.pointerEvents = "";
  } else if (keepSpace) {
    row.style.visibility = "hidden";
    row.style.pointerEvents = "none";
  } else {
    row.style.display = "none";
    row.style.visibility = "";
    row.style.pointerEvents = "";
  }
};

GameManager.prototype.setCapped64RowVisible = function (value, visible) {
  this.setTimerRowVisibleState(value, visible, true);
};

GameManager.prototype.resetProgressiveCapped64Rows = function () {
  this.capped64Unlocked = { "16": false, "32": false, "64": false };
  var values = [16, 32, 64];
  for (var i = 0; i < values.length; i++) {
    this.setCapped64RowVisible(values[i], false);
  }
};

GameManager.prototype.unlockProgressiveCapped64Row = function (value) {
  if (!this.isProgressiveCapped64Mode()) return;
  if (value !== 16 && value !== 32 && value !== 64) return;
  if (!this.capped64Unlocked) {
    this.capped64Unlocked = { "16": false, "32": false, "64": false };
  }
  if (this.capped64Unlocked[String(value)]) return;
  this.capped64Unlocked[String(value)] = true;
  this.setCapped64RowVisible(value, true);
};

GameManager.prototype.repositionCappedTimerContainer = function () {
  var container = document.getElementById("capped-timer-container");
  if (!container) return;
  var target = this.getCappedTargetValue();
  if (!target) target = 2048;
  var anchorRow = this.getTimerRowEl(target);
  if (!anchorRow || !anchorRow.parentNode) return;
  var parent = anchorRow.parentNode;
  if (container.parentNode !== parent || anchorRow.nextSibling !== container) {
    parent.insertBefore(container, anchorRow.nextSibling);
  }
};

GameManager.prototype.applyCappedRowVisibility = function () {
  var i;
  if (!this.isCappedMode()) {
    for (i = 0; i < GameManager.TIMER_SLOT_IDS.length; i++) {
      this.setTimerRowVisibleState(GameManager.TIMER_SLOT_IDS[i], true, false);
    }
    return;
  }
  if (this.isProgressiveCapped64Mode()) {
    for (i = 0; i < GameManager.TIMER_SLOT_IDS.length; i++) {
      this.setTimerRowVisibleState(GameManager.TIMER_SLOT_IDS[i], false, true);
    }
    this.resetProgressiveCapped64Rows();
    return;
  }
  var cap = this.getCappedTargetValue();
  for (i = 0; i < GameManager.TIMER_SLOT_IDS.length; i++) {
    var value = GameManager.TIMER_SLOT_IDS[i];
    this.setTimerRowVisibleState(value, value <= cap, true);
  }
};

GameManager.prototype.resetCappedDynamicTimers = function () {
  this.cappedMilestoneCount = 0;
  var cappedContainer = document.getElementById("capped-timer-container");
  if (cappedContainer) cappedContainer.innerHTML = "";
  var overflowContainer = document.getElementById("capped-timer-overflow-container");
  if (overflowContainer) overflowContainer.innerHTML = "";
  this.resetCappedPlaceholderRows();
  this.getCappedOverflowContainer();
  if (typeof window.cappedTimerReset === "function") window.cappedTimerReset();
};

GameManager.prototype.getCappedTimerLegendClass = function () {
  var slotId = this.timerMilestoneSlotByValue
    ? this.timerMilestoneSlotByValue[String(this.getCappedTargetValue())]
    : null;
  return slotId ? ("timertile timer-legend-" + slotId) : "timertile";
};

GameManager.prototype.getCappedTimerFontSize = function () {
  var cap = this.getCappedTargetValue() || 2048;
  if (cap >= 8192) return "13px";
  if (cap >= 1024) return "14px";
  if (cap >= 128) return "18px";
  return "22px";
};

GameManager.prototype.getCappedRepeatLabel = function (repeatCount) {
  return "x" + String(repeatCount);
};

GameManager.prototype.getCappedPlaceholderRowValues = function () {
  if (!this.isCappedMode()) return [];
  var cap = this.getCappedTargetValue();
  var values = [];
  for (var i = 0; i < GameManager.TIMER_SLOT_IDS.length; i++) {
    var value = GameManager.TIMER_SLOT_IDS[i];
    if (value > cap) values.push(value);
  }
  return values;
};

GameManager.prototype.resetCappedPlaceholderRows = function () {
  if (!this.isCappedMode()) return;
  var values = this.getCappedPlaceholderRowValues();
  for (var i = 0; i < values.length; i++) {
    var slotId = String(values[i]);
    var row = this.getTimerRowEl(slotId);
    var timerEl = document.getElementById("timer" + slotId);
    if (timerEl) timerEl.textContent = "";
    if (!row) continue;

    var legend = row.querySelector(".timertile");
    if (legend) {
      legend.className = "timertile timer-legend-" + slotId;
      legend.textContent = slotId;
    }
    row.removeAttribute("data-capped-repeat");
  }
};

GameManager.prototype.fillCappedPlaceholderRowByRepeat = function (repeatCount, labelText, timeStr) {
  if (!this.isCappedMode()) return false;
  if (!Number.isInteger(repeatCount) || repeatCount < 2) return false;

  var values = this.getCappedPlaceholderRowValues();
  var placeholderIndex = repeatCount - 2; // x2 => first placeholder row
  if (placeholderIndex < 0 || placeholderIndex >= values.length) return false;

  var slotId = String(values[placeholderIndex]);
  var row = this.getTimerRowEl(slotId);
  var timerEl = document.getElementById("timer" + slotId);
  if (!row || !timerEl) return false;

  var legend = row.querySelector(".timertile");
  if (legend) {
    legend.className = this.getCappedTimerLegendClass();
    legend.style.color = "#f9f6f2";
    legend.style.fontSize = this.getCappedTimerFontSize();
    legend.textContent = labelText;
  }

  timerEl.textContent = timeStr;
  row.setAttribute("data-capped-repeat", String(repeatCount));
  this.setTimerRowVisibleState(slotId, true, true);
  this.normalizeCappedRepeatLegendClasses();
  return true;
};

GameManager.prototype.getCappedOverflowContainer = function () {
  if (!this.isCappedMode()) return null;
  var id = "capped-timer-overflow-container";
  var container = document.getElementById(id);
  if (!container) {
    container = document.createElement("div");
    container.id = id;
  }

  var values = this.getCappedPlaceholderRowValues();
  if (!values.length) return container;
  var anchor = this.getTimerRowEl(values[values.length - 1]);
  if (!anchor || !anchor.parentNode) return container;

  if (container.parentNode !== anchor.parentNode || anchor.nextSibling !== container) {
    anchor.parentNode.insertBefore(container, anchor.nextSibling);
  }
  return container;
};

GameManager.prototype.recordCappedMilestone = function (timeStr) {
  if (!this.isCappedMode()) return;

  this.cappedMilestoneCount += 1;
  var capLabel = String(this.getCappedTargetValue());
  var baseTimerEl = document.getElementById("timer" + capLabel);
  var container = this.getCappedOverflowContainer();

  if (this.cappedMilestoneCount === 1) {
    if (baseTimerEl && baseTimerEl.textContent === "") {
      baseTimerEl.textContent = timeStr;
    }
    return;
  }

  var nextLabel = this.getCappedRepeatLabel(this.cappedMilestoneCount);

  // Prefer replacing reserved hidden rows so the timer module height stays stable.
  if (this.fillCappedPlaceholderRowByRepeat(this.cappedMilestoneCount, nextLabel, timeStr)) {
    if (typeof window.cappedTimerAutoScroll === "function") {
      window.cappedTimerAutoScroll();
    }
    return;
  }

  if (!container) return;
  var rowDiv = this.createSavedDynamicTimerRow({
    repeat: String(this.cappedMilestoneCount),
    label: nextLabel,
    time: timeStr
  });
  container.appendChild(rowDiv);
  this.normalizeCappedRepeatLegendClasses();

  if (typeof window.cappedTimerAutoScroll === "function") {
    window.cappedTimerAutoScroll();
  }
};

GameManager.prototype.initCornerStats = function () {
  var rateEl = document.getElementById("stats-4-rate");
  var ipsEl = document.getElementById("stats-ips");

  if (rateEl) {
    rateEl.style.visibility = "hidden"; // Preserve layout while moving display to page corner
    this.cornerRateEl = document.getElementById("corner-stats-4-rate");
    if (!this.cornerRateEl) {
      this.cornerRateEl = document.createElement("div");
      this.cornerRateEl.id = "corner-stats-4-rate";
      document.body.appendChild(this.cornerRateEl);
    }
    this.cornerRateEl.style.position = "fixed";
    this.cornerRateEl.style.top = "8px";
    this.cornerRateEl.style.left = "10px";
    this.cornerRateEl.style.zIndex = "1000";
    this.cornerRateEl.style.background = "transparent";
    this.cornerRateEl.style.color = "#776e65";
    this.cornerRateEl.style.fontWeight = "bold";
    this.cornerRateEl.style.fontSize = "27px";
    this.cornerRateEl.style.pointerEvents = "none";
    this.cornerRateEl.textContent = "0.00";
  }

  if (ipsEl) {
    ipsEl.style.visibility = "hidden"; // Preserve layout while moving display to page corner
    this.cornerIpsEl = document.getElementById("corner-stats-ips");
    if (!this.cornerIpsEl) {
      this.cornerIpsEl = document.createElement("div");
      this.cornerIpsEl.id = "corner-stats-ips";
      document.body.appendChild(this.cornerIpsEl);
    }
    this.cornerIpsEl.style.position = "fixed";
    this.cornerIpsEl.style.top = "8px";
    this.cornerIpsEl.style.right = "10px";
    this.cornerIpsEl.style.zIndex = "1000";
    this.cornerIpsEl.style.background = "transparent";
    this.cornerIpsEl.style.color = "#776e65";
    this.cornerIpsEl.style.fontWeight = "bold";
    this.cornerIpsEl.style.fontSize = "27px";
    this.cornerIpsEl.style.pointerEvents = "none";
    this.cornerIpsEl.textContent = "IPS: 0";
  }
};

GameManager.prototype.initStatsPanelUi = function () {
  if (typeof document === "undefined" || !document.body) return;

  var btn = document.getElementById("stats-panel-toggle");
  if (!btn) {
    btn = document.createElement("a");
    btn.id = "stats-panel-toggle";
  }
  btn.title = "统计";
  btn.setAttribute("aria-label", "统计");
  if (!btn.querySelector("svg")) {
    btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>';
  }
  btn.className = "top-action-btn stats-panel-toggle";
  var exportBtn = document.getElementById("top-export-replay-btn");
  var topActionHost = null;
  var practiceStatsActions = document.getElementById("practice-stats-actions");
  if (practiceStatsActions) {
    topActionHost = practiceStatsActions;
  } else if (exportBtn && exportBtn.parentNode) {
    topActionHost = exportBtn.parentNode;
  } else {
    topActionHost = document.querySelector(".heading .top-action-buttons") || document.querySelector(".top-action-buttons");
  }
  if (topActionHost) {
    btn.classList.remove("is-floating");
    if (exportBtn && exportBtn.parentNode === topActionHost) {
      if (btn.parentNode !== topActionHost || btn.nextSibling !== exportBtn) {
        topActionHost.insertBefore(btn, exportBtn);
      }
    } else if (btn.parentNode !== topActionHost) {
      topActionHost.insertBefore(btn, topActionHost.firstChild);
    }
  } else {
    if (btn.parentNode !== document.body) {
      document.body.appendChild(btn);
    }
    btn.classList.add("is-floating");
  }

  var overlay = document.getElementById("stats-panel-overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "stats-panel-overlay";
    overlay.className = "replay-modal-overlay";
    overlay.style.display = "none";
    overlay.innerHTML =
      "<div class='replay-modal-content stats-panel-content'>" +
      "<h3>统计汇总</h3>" +
      "<div class='stats-panel-row'><span>总步数</span><span id='stats-panel-total'>0</span></div>" +
      "<div class='stats-panel-row'><span>移动步数</span><span id='stats-panel-moves'>0</span></div>" +
      "<div class='stats-panel-row'><span>撤回步数</span><span id='stats-panel-undo'>0</span></div>" +
      "<div class='stats-panel-row'><span id='stats-panel-two-label'>出2数量</span><span id='stats-panel-two'>0</span></div>" +
      "<div class='stats-panel-row'><span id='stats-panel-four-label'>出4数量</span><span id='stats-panel-four'>0</span></div>" +
      "<div class='stats-panel-row'><span id='stats-panel-four-rate-label'>实际出4率</span><span id='stats-panel-four-rate'>0.00</span></div>" +
      "<div class='replay-modal-actions'>" +
      "<button id='stats-panel-close' class='replay-button'>关闭</button>" +
      "</div>" +
      "</div>";
    document.body.appendChild(overlay);
  }

  var self = this;
  if (!btn.__statsBound) {
    btn.__statsBound = true;
    btn.addEventListener("click", function (event) {
      event.preventDefault();
      self.openStatsPanel();
    });
  }
  var closeBtn = document.getElementById("stats-panel-close");
  if (closeBtn && !closeBtn.__statsBound) {
    closeBtn.__statsBound = true;
    closeBtn.addEventListener("click", function () {
      self.closeStatsPanel();
    });
  }
  if (!overlay.__statsBound) {
    overlay.__statsBound = true;
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) self.closeStatsPanel();
    });
  }

  var isOpen = false;
  try {
    isOpen = localStorage.getItem(GameManager.STATS_PANEL_VISIBLE_KEY) === "1";
  } catch (_err) {}
  overlay.style.display = isOpen ? "flex" : "none";
};

GameManager.prototype.openStatsPanel = function () {
  var overlay = document.getElementById("stats-panel-overlay");
  if (!overlay) return;
  overlay.style.display = "flex";
  this.updateStatsPanel();
  try {
    localStorage.setItem(GameManager.STATS_PANEL_VISIBLE_KEY, "1");
  } catch (_err) {}
};

GameManager.prototype.closeStatsPanel = function () {
  var overlay = document.getElementById("stats-panel-overlay");
  if (!overlay) return;
  overlay.style.display = "none";
  try {
    localStorage.setItem(GameManager.STATS_PANEL_VISIBLE_KEY, "0");
  } catch (_err) {}
};

GameManager.prototype.isTimerLeaderboardAvailableByMode = function (mode) {
  void mode;
  return true;
};

GameManager.prototype.isTimerLeaderboardAvailable = function () {
  return true;
};

GameManager.prototype.getTimerModuleViewMode = function () {
  return this.timerModuleView === "hidden" ? "hidden" : "timer";
};

GameManager.prototype.loadTimerModuleViewForMode = function (mode) {
  var map = {};
  try {
    map = JSON.parse(localStorage.getItem(GameManager.TIMER_MODULE_VIEW_SETTINGS_KEY) || "{}");
  } catch (_err) {
    map = {};
  }
  var value = map[mode];
  return value === "hidden" ? "hidden" : "timer";
};

GameManager.prototype.persistTimerModuleViewForMode = function (mode, view) {
  var map = {};
  try {
    map = JSON.parse(localStorage.getItem(GameManager.TIMER_MODULE_VIEW_SETTINGS_KEY) || "{}");
  } catch (_err) {
    map = {};
  }
  map[mode] = view === "hidden" ? "hidden" : "timer";
  try {
    localStorage.setItem(GameManager.TIMER_MODULE_VIEW_SETTINGS_KEY, JSON.stringify(map));
  } catch (_err2) {}
};

GameManager.prototype.notifyTimerModuleSettingsStateChanged = function () {
  if (typeof window !== "undefined" && typeof window.syncTimerModuleSettingsUI === "function") {
    window.syncTimerModuleSettingsUI();
  }
};

GameManager.prototype.captureTimerModuleBaseHeight = function () {
  var timerBox = document.getElementById("timerbox");
  if (!timerBox) return;
  var h = Math.max(timerBox.offsetHeight || 0, timerBox.scrollHeight || 0);
  if (h > 0) {
    this.timerModuleBaseHeight = Math.max(this.timerModuleBaseHeight || 0, h);
  }
};

GameManager.prototype.applyTimerModuleView = function (view, skipPersist) {
  var timerBox = document.getElementById("timerbox");
  if (!timerBox) return;
  this.captureTimerModuleBaseHeight();
  var next = view === "hidden" ? "hidden" : "timer";
  this.timerModuleView = next;
  if (next === "hidden") timerBox.classList.add("timerbox-hidden-mode");
  else timerBox.classList.remove("timerbox-hidden-mode");
  if (this.timerModuleBaseHeight > 0) {
    timerBox.style.minHeight = this.timerModuleBaseHeight + "px";
  }

  if (!skipPersist) {
    this.persistTimerModuleViewForMode(this.mode, next);
  }
  this.notifyTimerModuleSettingsStateChanged();
};

GameManager.prototype.setTimerModuleViewMode = function (view, skipPersist) {
  this.applyTimerModuleView(view, !!skipPersist);
};

GameManager.prototype.getServerMode = function (mode) {
  return this.getLegacyModeFromModeKey(mode || this.modeKey || this.mode);
};

GameManager.prototype.getForcedUndoSettingForMode = function (mode) {
  var modeId = (mode || this.mode || "").toLowerCase();
  var modeCfg = this.resolveModeConfig(mode || this.mode);
  if (modeCfg && typeof modeCfg.undo_enabled === "boolean") {
    return modeCfg.undo_enabled;
  }
  if (!modeId) return null;
  if (modeId === "capped" || modeId.indexOf("capped") !== -1) return false;
  if (modeId.indexOf("no_undo") !== -1 || modeId.indexOf("no-undo") !== -1) return false;
  if (modeId.indexOf("undo_only") !== -1 || modeId.indexOf("undo-only") !== -1) return true;
  return null;
};

GameManager.prototype.isUndoAllowedByMode = function (mode) {
  return this.getForcedUndoSettingForMode(mode) !== false;
};

GameManager.prototype.isUndoSettingFixedForMode = function (mode) {
  return this.getForcedUndoSettingForMode(mode) !== null;
};

GameManager.prototype.canToggleUndoSetting = function (mode) {
  var targetMode = mode || this.mode;
  if (!this.isUndoAllowedByMode(targetMode)) return false;
  if (this.isUndoSettingFixedForMode(targetMode)) return false;
  return !this.hasGameStarted;
};

GameManager.prototype.notifyUndoSettingsStateChanged = function () {
  if (typeof window !== "undefined" && typeof window.syncUndoSettingsUI === "function") {
    window.syncUndoSettingsUI();
  }
};

GameManager.prototype.loadUndoSettingForMode = function (mode) {
  var forced = this.getForcedUndoSettingForMode(mode);
  if (forced !== null) return forced;
  if (!this.isUndoAllowedByMode(mode)) return false;
  var map = {};
  try {
    map = JSON.parse(localStorage.getItem(GameManager.UNDO_SETTINGS_KEY) || "{}");
  } catch (_err) {
    map = {};
  }
  if (Object.prototype.hasOwnProperty.call(map, mode)) {
    return !!map[mode];
  }
  return true;
};

GameManager.prototype.persistUndoSettingForMode = function (mode, enabled) {
  if (this.isUndoSettingFixedForMode(mode)) return;
  if (!this.isUndoAllowedByMode(mode)) return;
  var map = {};
  try {
    map = JSON.parse(localStorage.getItem(GameManager.UNDO_SETTINGS_KEY) || "{}");
  } catch (_err) {
    map = {};
  }
  map[mode] = !!enabled;
  try {
    localStorage.setItem(GameManager.UNDO_SETTINGS_KEY, JSON.stringify(map));
  } catch (_err2) {}
};

GameManager.prototype.setUndoEnabled = function (enabled, skipPersist, forceChange) {
  var forced = this.getForcedUndoSettingForMode(this.mode);
  if (forced !== null) {
    this.undoEnabled = forced;
  } else if (forceChange || this.canToggleUndoSetting(this.mode)) {
    this.undoEnabled = !!enabled;
    if (!skipPersist) {
      this.persistUndoSettingForMode(this.mode, this.undoEnabled);
    }
  }
  this.updateUndoUiState();
  this.notifyUndoSettingsStateChanged();
};

GameManager.prototype.isUndoInteractionEnabled = function () {
  if (this.replayMode) return false;
  if (this.undoLimit !== null && this.undoUsed >= this.undoLimit) return false;
  return !!(this.undoEnabled && this.isUndoAllowedByMode(this.mode));
};

GameManager.prototype.updateUndoUiState = function () {
  var canUndo = this.isUndoInteractionEnabled();
  var undoLink = document.getElementById("undo-link");
  if (undoLink) {
    undoLink.style.pointerEvents = canUndo ? "" : "none";
    undoLink.style.opacity = canUndo ? "" : "0.45";
  }
  var undoBtn = document.getElementById("undo-btn-gameover");
  if (undoBtn) {
    undoBtn.style.display = canUndo ? "inline-block" : "none";
  }
};

GameManager.prototype.recordSpawnValue = function (value) {
  if (!this.spawnValueCounts) this.spawnValueCounts = {};
  var k = String(value);
  this.spawnValueCounts[k] = (this.spawnValueCounts[k] || 0) + 1;

  // Keep legacy fields for compatibility with existing UI hooks.
  this.spawnTwos = this.spawnValueCounts["2"] || 0;
  this.spawnFours = this.spawnValueCounts["4"] || 0;
  this.refreshSpawnRateDisplay();
};

GameManager.prototype.getSpawnStatPair = function () {
  var table = Array.isArray(this.spawnTable) ? this.spawnTable : [];
  var values = [];
  for (var i = 0; i < table.length; i++) {
    var item = table[i];
    if (!item || !Number.isInteger(Number(item.value)) || Number(item.value) <= 0) continue;
    var v = Number(item.value);
    if (values.indexOf(v) === -1) {
      values.push(v);
    }
  }
  values.sort(function (a, b) { return a - b; });
  var primary = values.length > 0 ? values[0] : 2;
  var secondary = values.length > 1 ? values[1] : primary;
  return {
    primary: primary,
    secondary: secondary
  };
};

GameManager.prototype.getSpawnCount = function (value) {
  if (!this.spawnValueCounts) return 0;
  return this.spawnValueCounts[String(value)] || 0;
};

GameManager.prototype.getTotalSpawnCount = function () {
  if (!this.spawnValueCounts) return 0;
  var total = 0;
  for (var k in this.spawnValueCounts) {
    if (Object.prototype.hasOwnProperty.call(this.spawnValueCounts, k)) {
      total += this.spawnValueCounts[k] || 0;
    }
  }
  return total;
};

GameManager.prototype.refreshSpawnRateDisplay = function () {
  // Top-left rate: current observed secondary spawn rate.
  // pow2 => 出4率, fibonacci => 出2率
  var text = this.getActualSecondaryRate();
  var rateEl = document.getElementById("stats-4-rate");
  if (rateEl) rateEl.textContent = text;
  if (this.cornerRateEl) this.cornerRateEl.textContent = text;
};

GameManager.prototype.getActualSecondaryRate = function () {
  var pair = this.getSpawnStatPair();
  var total = this.getTotalSpawnCount();
  if (total <= 0) return "0.00";
  return ((this.getSpawnCount(pair.secondary) / total) * 100).toFixed(2);
};

GameManager.prototype.getActualFourRate = function () {
  // Keep old method name for compatibility.
  return this.getActualSecondaryRate();
};

GameManager.prototype.updateStatsPanelLabels = function () {
  var pair = this.getSpawnStatPair();
  var twoLabel = document.getElementById("stats-panel-two-label");
  if (twoLabel) twoLabel.textContent = "出" + pair.primary + "数量";
  var fourLabel = document.getElementById("stats-panel-four-label");
  if (fourLabel) fourLabel.textContent = "出" + pair.secondary + "数量";
  var rateLabel = document.getElementById("stats-panel-four-rate-label");
  if (rateLabel) rateLabel.textContent = "实际出" + pair.secondary + "率";
};

GameManager.prototype.updateStatsPanel = function (totalSteps, moveSteps, undoSteps) {
  var fallback = this.computeStepStats();
  if (typeof totalSteps === "undefined") totalSteps = fallback.totalSteps;
  if (typeof moveSteps === "undefined") moveSteps = fallback.moveSteps;
  if (typeof undoSteps === "undefined") undoSteps = fallback.undoSteps;
  this.updateStatsPanelLabels();

  var pair = this.getSpawnStatPair();

  var totalEl = document.getElementById("stats-panel-total");
  if (totalEl) totalEl.textContent = String(totalSteps);
  var movesEl = document.getElementById("stats-panel-moves");
  if (movesEl) movesEl.textContent = String(moveSteps);
  var undoEl = document.getElementById("stats-panel-undo");
  if (undoEl) undoEl.textContent = String(undoSteps);
  var twoEl = document.getElementById("stats-panel-two");
  if (twoEl) twoEl.textContent = String(this.getSpawnCount(pair.primary));
  var fourEl = document.getElementById("stats-panel-four");
  if (fourEl) fourEl.textContent = String(this.getSpawnCount(pair.secondary));
  var rateEl = document.getElementById("stats-panel-four-rate");
  if (rateEl) rateEl.textContent = this.getActualSecondaryRate();
};

GameManager.prototype.computeStepStats = function () {
  var self = this;
  var totalSteps = 0;
  var moveSteps = 0;
  var undoSteps = 0;
  var limit = this.replayMode ? this.replayIndex : this.moveHistory.length;
  var src = this.replayMode ? this.replayMoves : this.moveHistory;

  var calculateNetMoves = function (moves, max) {
    var count = 0;
    for (var i = 0; i < max; i++) {
      var kind = self.getActionKind(moves[i]);
      if (kind === "u") {
        if (count > 0) count--;
      } else if (kind === "m") {
        count++;
      }
    }
    return count;
  };

  if (src) {
    totalSteps = limit;
    moveSteps = calculateNetMoves(src, limit);
    for (var j = 0; j < limit; j++) {
      if (self.getActionKind(src[j]) === "u") undoSteps++;
    }
  }
  return {
    totalSteps: totalSteps,
    moveSteps: moveSteps,
    undoSteps: undoSteps
  };
};

// Restart the game
GameManager.prototype.restart = function () {
  if (confirm("是否确认开始新游戏?")) {
      this.actuator.continue();
      this.undoStack = [];
      this.clearSavedGameState(this.modeKey);
      if (this.modeKey === "practice_legacy" && this.practiceRestartBoardMatrix) {
        this.restartWithBoard(
          this.practiceRestartBoardMatrix,
          this.practiceRestartModeConfig || this.modeConfig,
          { preservePracticeRestartBase: true }
        );
        this.isTestMode = true;
        return;
      }
      this.setup(undefined, { disableStateRestore: true });
  }
};

GameManager.prototype.restartWithSeed = function (seed, modeConfig) {
  this.actuator.continue();
  this.setup(seed, { modeConfig: modeConfig, disableStateRestore: true }); // Force setup with specific seed
};

GameManager.prototype.setPracticeRestartBase = function (board, modeConfig) {
  if (!Array.isArray(board) || board.length !== this.height) return;
  this.practiceRestartBoardMatrix = this.cloneBoardMatrix(board);
  this.practiceRestartModeConfig = modeConfig ? this.clonePlain(modeConfig) : this.clonePlain(this.modeConfig);
};

GameManager.prototype.restartWithBoard = function (board, modeConfig, options) {
  options = options || {};
  this.actuator.continue();
  // Seed is irrelevant here; replay spawns are driven by encoded log.
  this.setup(0, { skipStartTiles: true, modeConfig: modeConfig, disableStateRestore: true });
  this.setBoardFromMatrix(board);
  this.initialBoardMatrix = this.getFinalBoardMatrix();
  this.replayStartBoardMatrix = this.cloneBoardMatrix(this.initialBoardMatrix);
  if (this.modeKey === "practice_legacy" && (options.setPracticeRestartBase || options.preservePracticeRestartBase)) {
    this.setPracticeRestartBase(this.initialBoardMatrix, modeConfig || this.modeConfig);
  }
  this.actuate();
};

// Keep playing after winning
GameManager.prototype.keepPlaying = function () {
  this.keepPlaying = true;
  this.actuator.continue();
};

GameManager.prototype.isGameTerminated = function () {
  if (this.over || (this.won && !this.keepPlaying)) {
    this.stopTimer();
    this.timerEnd = Date.now();
    return true;
  } else {
    return false;
  }
};

// Set up the game
GameManager.prototype.setup = function (inputSeed, options) {
  options = options || {};
  var detectedMode = this.detectMode();
  var resolvedModeConfig = options.modeConfig || this.resolveModeConfig(detectedMode);
  this.applyModeConfig(resolvedModeConfig);
  if (typeof window !== "undefined") {
    window.GAME_MODE_CONFIG = this.clonePlain(this.modeConfig);
  }
  this.grid        = new Grid(this.width, this.height);

  this.score       = 0;
  this.over        = false;
  this.won         = false;
  this.keepPlaying = false;
  
  // Replay logic
  var hasInputSeed = typeof inputSeed !== "undefined";
  if (hasInputSeed) {
    this.replayIndex = 0;
  }
  this.initialSeed = hasInputSeed ? inputSeed : Math.random();
  this.seed        = this.initialSeed;
  this.moveHistory = [];
  this.replayMode  = hasInputSeed; // If seed is provided externally, we might be in replay mode (or just restoring)
  this.replayCompactLog = "";
  this.initialBoardMatrix = null;
  this.replayStartBoardMatrix = null;
  if (!hasInputSeed) {
    this.disableSessionSync = false;
  }
  this.sessionSubmitDone = false;
  this.sessionReplayV3 = {
    v: 3,
    mode: this.getServerMode(this.modeKey),
    mode_key: this.modeKey,
    board_width: this.width,
    board_height: this.height,
    ruleset: this.ruleset,
    undo_enabled: !!this.modeConfig.undo_enabled,
    mode_family: this.modeFamily,
    rank_policy: this.rankPolicy,
    special_rules_snapshot: this.clonePlain(this.specialRules || {}),
    challenge_id: this.challengeId,
    seed: this.initialSeed,
    actions: []
  };
  this.challengeId = typeof options.challengeId === "string" && options.challengeId
    ? options.challengeId
    : null;
  if (!this.challengeId && typeof window !== "undefined" && window.GAME_CHALLENGE_CONTEXT && window.GAME_CHALLENGE_CONTEXT.id) {
    this.challengeId = window.GAME_CHALLENGE_CONTEXT.id;
    this.sessionReplayV3.challenge_id = this.challengeId;
  }
  if (this.challengeId) this.sessionReplayV3.challenge_id = this.challengeId;
  this.lastSpawn = null; // To capture spawn during play
  this.forcedSpawn = null; // To force spawn during replay v2
  
  this.reached32k = false; // Flag for extended timer logic
  this.isTestMode = false; // Flag for Test Board
  this.cappedMilestoneCount = 0; // Track how many times maxTile has been merged in capped mode

  this.timerStatus = 0; // 0 = no, 1 = running (reference logic)
  this.startTime = null;
  this.timerID = null;
  this.time = 0;
  this.accumulatedTime = 0; // For pausing logic
  this.pendingMoveInput = null;
  this.moveInputFlushScheduled = false;
  this.lastMoveInputAt = 0;
  this.sessionStartedAt = Date.now();
  this.hasGameStarted = false;
  this.configureTimerMilestones();
  this.comboStreak = 0;
  this.successfulMoveCount = 0;
  this.undoUsed = 0;
  this.lockConsumedAtMoveCount = -1;
  this.lockedDirectionTurn = null;
  this.lockedDirection = null;

  // Stats
  this.spawnValueCounts = {};
  this.spawnTwos = 0;
  this.spawnFours = 0;
  this.undoEnabled = this.loadUndoSettingForMode(this.mode);
  var preferredTimerModuleView = this.loadTimerModuleViewForMode(this.mode);
  if (this.ipsInterval) clearInterval(this.ipsInterval);

  var legacyTotalEl = document.getElementById("stats-total");
  if (legacyTotalEl) legacyTotalEl.style.visibility = "hidden";
  var legacyMovesEl = document.getElementById("stats-moves");
  if (legacyMovesEl) legacyMovesEl.style.visibility = "hidden";
  var legacyUndoEl = document.getElementById("stats-undo");
  if (legacyUndoEl) legacyUndoEl.style.visibility = "hidden";
  
  if (document.getElementById("timer")) document.getElementById("timer").textContent = this.pretty(0);
  
  // Clear milestones
  var timerSlots = GameManager.TIMER_SLOT_IDS;
  timerSlots.forEach(function(slotId) {
      var el = document.getElementById("timer" + slotId);
      if (el) el.textContent = "";
  });
  // Clear sub timers
  var sub8k = document.getElementById("timer8192-sub");
  if (sub8k) sub8k.textContent = "";
  var sub16k = document.getElementById("timer16384-sub");
  if (sub16k) sub16k.textContent = "";
  var subContainer = document.getElementById("timer32k-sub-container");
  if (subContainer) subContainer.style.display = "none";
  this.repositionCappedTimerContainer();
  this.applyCappedRowVisibility();
  this.resetCappedDynamicTimers();

  // Add the initial tiles unless a replay imports an explicit board.
  var skipStartTiles = !!(options && options.skipStartTiles);
  var shouldRestoreState = !hasInputSeed && !skipStartTiles && !(options && options.disableStateRestore);
  var restoredFromSavedState = false;
  if (shouldRestoreState) {
    restoredFromSavedState = this.tryRestoreSavedGameState();
  }
  if (!skipStartTiles && !restoredFromSavedState) {
    this.addStartTiles();
  }
  if (!restoredFromSavedState) {
    this.initialBoardMatrix = this.getFinalBoardMatrix();
  }
  this.refreshSpawnRateDisplay();
  this.updateUndoUiState();
  this.notifyUndoSettingsStateChanged();
  this.applyTimerModuleView(preferredTimerModuleView, true);

  // Update the actuator
  this.actuate();
  if (restoredFromSavedState) {
    this.updateStatsPanel();
  } else {
    this.updateStatsPanel(0, 0, 0);
  }

  // 在线补传链路已移除，历史记录统一保存在本地。
};

// Set up the initial tiles to start the game with
GameManager.prototype.addStartTiles = function () {
  for (var i = 0; i < this.startTiles; i++) {
    this.addRandomTile();
  }
};

// Adds a tile in a random position
GameManager.prototype.addRandomTile = function () {
  // Replay v2 Logic: Use forced spawn if available
  if (this.replayMode && this.forcedSpawn) {
      if (this.grid.cellAvailable(this.forcedSpawn) && !this.isBlockedCell(this.forcedSpawn.x, this.forcedSpawn.y)) {
          var tile = new Tile(this.forcedSpawn, this.forcedSpawn.value);
          this.grid.insertTile(tile);
          this.recordSpawnValue(this.forcedSpawn.value);
          this.forcedSpawn = null; // Consumed
      }
      return;
  }
  // Normal Logic
  var available = this.getAvailableCells();
  if (available.length > 0) {
    Math.seedrandom(this.seed);
    
    // Fix: Use move history length (or replay index) instead of score to determine RNG state.
    // This ensures that Undo -> Move results in a DIFFERENT random tile (because history length increased),
    // while maintaining determinism for Replay.
    var steps = this.replayMode ? this.replayIndex : this.moveHistory.length;
    for (var i=0; i<steps; i++) {
      Math.random();
    }
    
    var value = this.pickSpawnValue();
    var cell = available[Math.floor(Math.random() * available.length)];
    var tile = new Tile(cell, value);

    this.grid.insertTile(tile);
    
    // Record spawn for v2 logging
    this.lastSpawn = { x: cell.x, y: cell.y, value: value };
    this.recordSpawnValue(value);
  }
};

// Sends the updated grid to the actuator
GameManager.prototype.actuate = function () {
  if (this.scoreManager.get() < this.score) {
    this.scoreManager.set(this.score);
  }

  this.actuator.actuate(this.grid, {
    score:      this.score,
    over:       this.over,
    won:        this.won,
    bestScore:  this.scoreManager.get(),
    terminated: this.isGameTerminated(),
    blockedCells: this.blockedCellsList || []
  });
  
  // Update Stats: Total Steps & Moves (Excluding Undo)
  var stepStats = this.computeStepStats();
  var totalSteps = stepStats.totalSteps;
  var moveSteps = stepStats.moveSteps;
  var undoSteps = stepStats.undoSteps;
  
  var totalEl = document.getElementById("stats-total");
  if (totalEl) totalEl.textContent = "总步数: " + totalSteps;
  
  var movesEl = document.getElementById("stats-moves");
  if (movesEl) movesEl.textContent = "移动步数: " + moveSteps; // "除撤回外已移动的步数"
  
  var undoEl = document.getElementById("stats-undo");
  if (undoEl) undoEl.textContent = "撤回步数: " + undoSteps;
  this.updateStatsPanel(totalSteps, moveSteps, undoSteps);

  if (this.timerContainer) {
    var time;
    if (this.timerStatus === 1) {
        time = Date.now() - this.startTime.getTime();
    } else {
        time = this.accumulatedTime;
    }
    this.timerContainer.textContent = this.pretty(time);
    
    // Update Average IPS (Total Steps / Time in seconds)
    var ipsEl = document.getElementById("stats-ips");
    if (ipsEl) {
        var seconds = time / 1000;
        var avgIps = 0;
        if (seconds > 0) {
            avgIps = (totalSteps / seconds).toFixed(2);
        }
        var ipsText = "IPS: " + avgIps;
        ipsEl.textContent = ipsText;
        if (this.cornerIpsEl) this.cornerIpsEl.textContent = ipsText;
    }
  }

  if (this.isSessionTerminated() && this.modeKey !== "practice_legacy") {
    this.clearSavedGameState(this.modeKey);
    this.tryAutoSubmitOnGameOver();
  } else {
    this.saveGameState();
  }

};

// Save all tile positions and remove merger info
GameManager.prototype.prepareTiles = function () {
  this.grid.eachCell(function (x, y, tile) {
    if (tile) {
      tile.mergedFrom = null;
      tile.savePosition();
    }
  });
};

GameManager.prototype.getMoveInputThrottleMs = function () {
  if (this.replayMode) return 0;
  var area = (this.width || 4) * (this.height || 4);
  if (area >= 100) return 65;
  if (area >= 64) return 45;
  return 0;
};

GameManager.prototype.flushPendingMoveInput = function () {
  this.moveInputFlushScheduled = false;
  if (this.pendingMoveInput === null || typeof this.pendingMoveInput === "undefined") return;
  var direction = this.pendingMoveInput;
  this.pendingMoveInput = null;

  var throttleMs = this.getMoveInputThrottleMs();
  if (throttleMs <= 0) {
    this.move(direction);
    return;
  }

  var now = Date.now();
  var wait = throttleMs - (now - this.lastMoveInputAt);
  if (wait <= 0) {
    this.lastMoveInputAt = now;
    this.move(direction);
    return;
  }

  var self = this;
  setTimeout(function () {
    if (self.pendingMoveInput !== null && typeof self.pendingMoveInput !== "undefined") {
      // Newer input exists; next flush will consume latest direction.
      if (!self.moveInputFlushScheduled) {
        self.moveInputFlushScheduled = true;
        window.requestAnimationFrame(function () {
          self.flushPendingMoveInput();
        });
      }
      return;
    }
    self.lastMoveInputAt = Date.now();
    self.move(direction);
  }, wait);
};

GameManager.prototype.handleMoveInput = function (direction) {
  if (direction === -1) {
    this.move(direction);
    return;
  }

  var throttleMs = this.getMoveInputThrottleMs();
  if (throttleMs <= 0) {
    this.move(direction);
    return;
  }

  var now = Date.now();
  if ((now - this.lastMoveInputAt) >= throttleMs && !this.moveInputFlushScheduled) {
    this.lastMoveInputAt = now;
    this.move(direction);
    return;
  }

  this.pendingMoveInput = direction;
  if (this.moveInputFlushScheduled) return;
  this.moveInputFlushScheduled = true;
  var self = this;
  window.requestAnimationFrame(function () {
    self.flushPendingMoveInput();
  });
};

// Move a tile and its representation
GameManager.prototype.moveTile = function (tile, cell) {
  this.grid.cells[tile.x][tile.y] = null;
  this.grid.cells[cell.x][cell.y] = tile;
  tile.updatePosition(cell);
};

// Move tiles on the grid in the specified direction
GameManager.prototype.move = function (direction) {
  // 0: up, 1: right, 2:down, 3: left, -1: undo
  var self = this;

  if (direction == -1) {
    if (!this.replayMode && !this.isUndoInteractionEnabled()) {
      return;
    }
    if (this.undoLimit !== null && this.undoUsed >= this.undoLimit) {
      return;
    }
    if (this.undoStack.length > 0) {
      var prev = this.undoStack.pop();

      this.grid.build();
      this.score = prev.score;
      for (var i in prev.tiles) {
        var t = prev.tiles[i];
        var tile = new Tile({x: t.x, y: t.y}, t.value);
        tile.previousPosition = {
          x: t.previousPosition.x,
          y: t.previousPosition.y
        };
        this.grid.cells[tile.x][tile.y] = tile;
      }
      this.comboStreak = Number.isInteger(prev.comboStreak) ? prev.comboStreak : 0;
      this.successfulMoveCount = Number.isInteger(prev.successfulMoveCount) ? prev.successfulMoveCount : 0;
      this.lockConsumedAtMoveCount = Number.isInteger(prev.lockConsumedAtMoveCount) ? prev.lockConsumedAtMoveCount : -1;
      this.lockedDirectionTurn = Number.isInteger(prev.lockedDirectionTurn) ? prev.lockedDirectionTurn : null;
      this.lockedDirection = Number.isInteger(prev.lockedDirection) ? prev.lockedDirection : null;
      this.undoUsed = Number.isInteger(prev.undoUsed) ? prev.undoUsed : this.undoUsed;

      this.over = false;
      this.won = false;
      this.keepPlaying = false;
      this.actuator.clearMessage(); // Clear Game Over message if present
      this.undoUsed++;
      
      // Record undo in history if valid
      if (!this.replayMode) {
          this.moveHistory.push(direction);
          this.appendCompactUndo();
          if (this.sessionReplayV3) {
              this.sessionReplayV3.actions.push(["u"]);
          }
      }
      
      this.actuate();
      
      // Resume timer if it was stopped (e.g. game over)
      if (this.timerStatus === 0) {
          this.startTimer();
      }
    }
    return;
  }

  if (this.isGameTerminated()) return; // Don't do anything if the game's over

  var lockedDirection = this.getLockedDirection();
  if (lockedDirection !== null) {
    this.consumeDirectionLock();
    if (Number(direction) === Number(lockedDirection)) {
      return;
    }
  }

  var cell, tile;

  var vector     = this.getVector(direction);
  var traversals = this.buildTraversals(vector);
  var moved      = false;
  var scoreBeforeMove = this.score;
  var undo       = {
    score: this.score,
    tiles: [],
    comboStreak: this.comboStreak,
    successfulMoveCount: this.successfulMoveCount,
    lockConsumedAtMoveCount: this.lockConsumedAtMoveCount,
    lockedDirectionTurn: this.lockedDirectionTurn,
    lockedDirection: this.lockedDirection,
    undoUsed: this.undoUsed
  };

  // Save the current tile positions and remove merger information
  this.prepareTiles();

  // Traverse the grid in the right direction and move tiles
  traversals.x.forEach(function (x) {
    traversals.y.forEach(function (y) {
      if (self.isBlockedCell(x, y)) return;
      cell = { x: x, y: y };
      tile = self.grid.cellContent(cell);

      if (tile) {
        var positions = self.findFarthestPosition(cell, vector);
        var next      = self.isBlockedCell(positions.next.x, positions.next.y) ? null : self.grid.cellContent(positions.next);

        var mergedValue = next ? self.getMergedValue(tile.value, next.value) : null;
        if (next && !next.mergedFrom && mergedValue !== null) {
          // We need to save tile since it will get removed
          undo.tiles.push(tile.save(positions.next));

          var merged = new Tile(positions.next, mergedValue);
          merged.mergedFrom = [tile, next];

          self.grid.insertTile(merged);
          self.grid.removeTile(tile);

          // Converge the two tiles' positions
          tile.updatePosition(positions.next);

          // Update the score
          self.score += merged.value;

          var timeStr = self.pretty(self.time);
          self.recordTimerMilestone(merged.value, timeStr);
          if (self.isCappedMode() && merged.value === self.getCappedTargetValue()) {
             self.recordCappedMilestone(timeStr);
          } else if (!self.isCappedMode() && merged.value === 2048) {
             self.won = true;
          }
          if (merged.value === 8192) {
             if (self.reached32k) {
                 // Sub timer logic
                 var sub = document.getElementById("timer8192-sub");
                 if (sub && sub.textContent === "") sub.textContent = timeStr;
             } else {
                 // Normal timer logic
                 var el = document.getElementById("timer8192");
                 if (el && el.textContent === "") el.textContent = timeStr;
             }
          }
          if (merged.value === 16384) {
             if (self.reached32k) {
                 // Sub timer logic
                 var sub = document.getElementById("timer16384-sub");
                 if (sub && sub.textContent === "") sub.textContent = timeStr;
             } else {
                 // Normal timer logic
                 var el = document.getElementById("timer16384");
                 if (el && el.textContent === "") el.textContent = timeStr;
             }
          }
          if (merged.value === 32768) {
             self.reached32k = true; // Flag reached
             if (document.getElementById("timer32768") && document.getElementById("timer32768").innerHTML === "") {
                 document.getElementById("timer32768").textContent = timeStr;
             }
             // Show sub-timer container
             var subContainer = document.getElementById("timer32k-sub-container");
             if (subContainer) subContainer.style.display = "block";
             
             // Hide 16 and 32 to save space (Limit to 12 items)
             if (document.getElementById("timer-row-16")) document.getElementById("timer-row-16").style.display = "none";
             if (document.getElementById("timer-row-32")) document.getElementById("timer-row-32").style.display = "none";
          }

        } else {
          // Save backup information
          undo.tiles.push(tile.save(positions.farthest));
          self.moveTile(tile, positions.farthest);
        }

        if (!self.positionsEqual(cell, tile)) {
          moved = true; // The tile moved from its original cell!
        }
      }
    });
  });

  if (moved) {
    var mergeGain = this.score - scoreBeforeMove;
    if (mergeGain > 0) {
      this.comboStreak += 1;
      if (this.comboMultiplier > 1 && this.comboStreak > 1) {
        var comboBonus = Math.floor(mergeGain * (this.comboMultiplier - 1) * (this.comboStreak - 1));
        if (comboBonus > 0) {
          this.score += comboBonus;
        }
      }
    } else {
      this.comboStreak = 0;
    }

    this.addRandomTile();
    this.successfulMoveCount += 1;

    if (!this.movesAvailable()) {
      this.over = true; // Game over!
      this.endTime(); // Stop timer on game over
    }

    // Save state
    this.undoStack.push(undo);
    
    // Record move for replay
    if (!this.replayMode) {
        this.moveHistory.push(direction);
        
        // V2 Logging: Record (Move + Spawn)
        // Code = (Dir * 32) + (Is4 * 16) + (PosIndex)
        // PosIndex = x + y*4
        if (
          this.lastSpawn &&
          this.width === 4 &&
          this.height === 4 &&
          !this.isFibonacciMode() &&
          (this.lastSpawn.value === 2 || this.lastSpawn.value === 4)
        ) {
            var valBit = (this.lastSpawn.value === 4) ? 1 : 0;
            var posIdx = this.lastSpawn.x + this.lastSpawn.y * 4;
            var code = (direction << 5) | (valBit << 4) | posIdx;
            this.appendCompactMoveCode(code);
        }
        if (this.sessionReplayV3) {
            this.sessionReplayV3.actions.push(["m", direction]);
        }
        this.lastSpawn = null;
    } // If in replay mode, we don't record the playback as new moves

    this.actuate();

    // Start timer on first move
    if (this.timerStatus === 0 && !this.over) {
      this.startTimer();
    }
  }
};

// Get the vector representing the chosen direction
GameManager.prototype.getVector = function (direction) {
  // Vectors representing tile movement
  var map = {
    0: { x: 0,  y: -1 }, // up
    1: { x: 1,  y: 0 },  // right
    2: { x: 0,  y: 1 },  // down
    3: { x: -1, y: 0 }   // left
  };

  return map[direction];
};

// Build a list of positions to traverse in the right order
GameManager.prototype.buildTraversals = function (vector) {
  var traversals = { x: [], y: [] };

  for (var x = 0; x < this.width; x++) {
    traversals.x.push(x);
  }
  for (var y = 0; y < this.height; y++) {
    traversals.y.push(y);
  }

  // Always traverse from the farthest cell in the chosen direction
  if (vector.x === 1) traversals.x = traversals.x.reverse();
  if (vector.y === 1) traversals.y = traversals.y.reverse();

  return traversals;
};

GameManager.prototype.findFarthestPosition = function (cell, vector) {
  var previous;

  // Progress towards the vector direction until an obstacle is found
  do {
    previous = cell;
    cell     = { x: previous.x + vector.x, y: previous.y + vector.y };
  } while (this.grid.withinBounds(cell) &&
           !this.isBlockedCell(cell.x, cell.y) &&
           this.grid.cellAvailable(cell));

  return {
    farthest: previous,
    next: cell // Used to check if a merge is required
  };
};

GameManager.prototype.movesAvailable = function () {
  return this.getAvailableCells().length > 0 || this.tileMatchesAvailable();
};

// Check for available matches between tiles (more expensive check)
GameManager.prototype.tileMatchesAvailable = function () {
  var self = this;

  var tile;

  for (var x = 0; x < this.width; x++) {
    for (var y = 0; y < this.height; y++) {
      if (this.isBlockedCell(x, y)) continue;
      tile = this.grid.cellContent({ x: x, y: y });

      if (tile) {
        for (var direction = 0; direction < 4; direction++) {
          var vector = self.getVector(direction);
          var cell   = { x: x + vector.x, y: y + vector.y };

          if (self.isBlockedCell(cell.x, cell.y)) continue;
          var other  = self.grid.cellContent(cell);

          if (other && self.getMergedValue(tile.value, other.value) !== null) {
            return true; // These two tiles can be merged
          }
        }
      }
    }
  }

  return false;
};

GameManager.prototype.positionsEqual = function (first, second) {
  return first.x === second.x && first.y === second.y;
};

// Start the timer
GameManager.prototype.startTimer = function() {
  if (this.timerStatus === 0) {
      this.timerStatus = 1;
      this.hasGameStarted = true;
      // Convert accumulated time back to a start timestamp relative to now
      this.startTime = new Date(Date.now() - (this.accumulatedTime || 0));
      this.notifyUndoSettingsStateChanged();
      var self = this;
      this.timerUpdateIntervalMs = this.getTimerUpdateIntervalMs();
      this.lastStatsPanelUpdateAt = 0;
      this.timerID = setInterval(function() {
          self.updateTimer();
      }, this.timerUpdateIntervalMs);
  }
};

GameManager.prototype.getTimerUpdateIntervalMs = function () {
  var area = (this.width || 4) * (this.height || 4);
  if (area >= 100) return 50;
  if (area >= 64) return 33;
  return 10;
};

GameManager.prototype.isStatsPanelOpen = function () {
  var overlay = document.getElementById("stats-panel-overlay");
  return !!(overlay && overlay.style.display !== "none");
};

GameManager.prototype.endTime = function() {
  this.stopTimer();
  var timerEl = document.getElementById("timer");
  if (timerEl) timerEl.textContent = this.pretty(this.accumulatedTime);
};

// Update the timer
GameManager.prototype.updateTimer = function() {
  if (!this.startTime) return;
  var curTime = new Date();
  var time = curTime.getTime() - this.startTime.getTime();
  this.time = time;
  var timerEl = document.getElementById("timer");
  if (timerEl) timerEl.textContent = this.pretty(time);
  
  // Update IPS in real-time (Total Steps / Time)
  var ipsEl = document.getElementById("stats-ips");
  if (ipsEl) {
      var seconds = time / 1000;
      var steps = this.replayMode ? this.replayIndex : this.moveHistory.length;
      var avgIps = 0;
      if (seconds > 0) {
          avgIps = (steps / seconds).toFixed(2);
      }
      var ipsText = "IPS: " + avgIps;
      ipsEl.textContent = ipsText;
      if (this.cornerIpsEl) this.cornerIpsEl.textContent = ipsText;
  }
  if (this.isStatsPanelOpen()) {
    if (!this.lastStatsPanelUpdateAt || (time - this.lastStatsPanelUpdateAt) >= 100) {
      this.updateStatsPanel();
      this.lastStatsPanelUpdateAt = time;
    }
  }
};

GameManager.prototype.stopTimer = function() {
    if (this.timerStatus === 1) {
        this.accumulatedTime = Date.now() - this.startTime.getTime();
        clearInterval(this.timerID);
        this.timerID = null;
        this.timerStatus = 0;
    }
};

GameManager.prototype.pretty = function(time) {
  if (time < 0) {return "DNF";}
    var bits = time % 1000;
    time = (time - bits) / 1000;
    var secs = time % 60;
    var mins = ((time - secs) / 60) % 60;
    var hours = (time - secs - 60 * mins) / 3600;
    var s = "" + bits;
    if (bits < 10) {s = "0" + s;}
    if (bits < 100) {s = "0" + s;}
    s = secs + "." + s;
    if (secs < 10 && (mins > 0 || hours > 0)) {s = "0" + s;}
    if (mins > 0 || hours > 0) {s = mins + ":" + s;}
    if (mins < 10 && hours > 0) {s = "0" + s;}
    if (hours > 0) {s = hours + ":" + s;}
  return s;
};



// Insert a custom tile (Test Board)
GameManager.prototype.insertCustomTile = function(x, y, value) {
    if (this.isBlockedCell(x, y)) {
        throw "Blocked cell cannot be edited";
    }
    if (this.grid.cellContent({ x: x, y: y })) {
        // Remove existing if needed? Or just overwrite?
        this.grid.removeTile(this.grid.cellContent({ x: x, y: y }));
    }
    
    // If value is 0, we just want to clear the tile.
    if (value === 0) {
        if (!this.replayMode && this.sessionReplayV3 && this.modeKey === "practice_legacy") {
            this.sessionReplayV3.actions.push(["p", x, y, value]);
            this.appendCompactPracticeAction(x, y, value);
        }
        this.actuate();
        return;
    }
    
    var tile = new Tile({ x: x, y: y }, value);
    this.grid.insertTile(tile);
    
    // Invalidate timers below this value
    this.invalidateTimers(value);
    
    // Check for 32k+ visibility
    if (value >= 32768) {
        this.reached32k = true;
        
        // Show sub-timer container
        var subContainer = document.getElementById("timer32k-sub-container");
        if (subContainer) subContainer.style.display = "block";
        
        // Hide 16 and 32 to save space
         if (document.getElementById("timer-row-16")) document.getElementById("timer-row-16").style.display = "none";
         if (document.getElementById("timer-row-32")) document.getElementById("timer-row-32").style.display = "none";
        
        
        // Ensure 32768 timer has text if empty
        if (value === 32768) {
             var timeStr = this.pretty(this.time);
             var timer32k = document.getElementById("timer32768");
             if (timer32k && timer32k.textContent === "") {
                 timer32k.textContent = timeStr;
             }
        }
    }
    
    // Refresh
    this.actuate();

    if (!this.replayMode && this.sessionReplayV3 && this.modeKey === "practice_legacy") {
        this.sessionReplayV3.actions.push(["p", x, y, value]);
        this.appendCompactPracticeAction(x, y, value);
    }
};

GameManager.prototype.invalidateTimers = function(limit) {
    var milestones = this.timerMilestones || this.getTimerMilestoneValues();
    var timerSlots = GameManager.TIMER_SLOT_IDS;
    for (var i = 0; i < timerSlots.length; i++) {
        var milestoneValue = milestones[i];
        var slotId = timerSlots[i];
        if (Number.isInteger(milestoneValue) && milestoneValue <= limit) {
             var el = document.getElementById("timer" + slotId);
             if (el) {
                 el.textContent = "---------";
                 // Also ensure it doesn't get overwritten later? 
                 // The move logic checks 'if (el.innerHTML === "")'. 
                 // Now it is "---------", so it won't be overwritten. Correct.
             }
        }
    }
    
    // 8k/16k sub-timers logic
    // Only invalidate sub-timers if we have actually reached the 32k phase.
    if (this.reached32k && !this.isFibonacciMode()) {
        if (8192 <= limit && limit !== 32768) {
            var sub8k = document.getElementById("timer8192-sub");
            if (sub8k) sub8k.textContent = "---------";
        }
        if (16384 <= limit && limit !== 32768) {
            var sub16k = document.getElementById("timer16384-sub");
            if (sub16k) sub16k.textContent = "---------";
        }
    }
};

GameManager.prototype.getFinalBoardMatrix = function () {
  var rows = [];
  for (var y = 0; y < this.height; y++) {
    var row = [];
    for (var x = 0; x < this.width; x++) {
      var tile = this.grid.cellContent({ x: x, y: y });
      row.push(tile ? tile.value : 0);
    }
    rows.push(row);
  }
  return rows;
};

GameManager.prototype.getBestTileValue = function () {
  var best = 0;
  this.grid.eachCell(function (_x, _y, tile) {
    if (tile && tile.value > best) best = tile.value;
  });
  return best;
};

GameManager.prototype.getDurationMs = function () {
  var ms = 0;
  if (this.timerStatus === 1 && this.startTime) {
    ms = Date.now() - this.startTime.getTime();
  } else {
    ms = this.accumulatedTime || 0;
  }
  if (!Number.isFinite(ms) || ms < 0) {
    ms = Date.now() - (this.sessionStartedAt || Date.now());
  }
  ms = Math.floor(ms);
  return ms < 0 ? 0 : ms;
};

GameManager.prototype.serializeV3 = function () {
  var replay = this.sessionReplayV3 || {
    v: 3,
    mode: this.getServerMode(this.modeKey),
    mode_key: this.modeKey,
    board_width: this.width,
    board_height: this.height,
    ruleset: this.ruleset,
    undo_enabled: !!this.modeConfig.undo_enabled,
    mode_family: this.modeFamily,
    rank_policy: this.rankPolicy,
    special_rules_snapshot: this.clonePlain(this.specialRules || {}),
    seed: this.initialSeed,
    actions: []
  };
  return {
    v: 3,
    mode: this.getServerMode(replay.mode_key || replay.mode || this.modeKey),
    mode_key: replay.mode_key || this.modeKey,
    board_width: replay.board_width || this.width,
    board_height: replay.board_height || this.height,
    ruleset: replay.ruleset || this.ruleset,
    undo_enabled: typeof replay.undo_enabled === "boolean" ? replay.undo_enabled : !!this.modeConfig.undo_enabled,
    mode_family: replay.mode_family || this.modeFamily,
    rank_policy: replay.rank_policy || this.rankPolicy,
    special_rules_snapshot: this.clonePlain(replay.special_rules_snapshot || this.specialRules || {}),
    challenge_id: replay.challenge_id || this.challengeId || null,
    seed: replay.seed,
    actions: replay.actions.slice()
  };
};

GameManager.prototype.tryAutoSubmitOnGameOver = function () {
  function setResult(payload) {
    try {
      localStorage.setItem("last_session_submit_result_v1", JSON.stringify(payload));
    } catch (_err) {}
  }

  if (this.sessionSubmitDone) return;
  if (this.replayMode) {
    setResult({
      at: new Date().toISOString(),
      ok: false,
      skipped: true,
      reason: "replay_mode"
    });
    return;
  }
  if (!this.isSessionTerminated()) {
    setResult({
      at: new Date().toISOString(),
      ok: false,
      skipped: true,
      reason: "not_terminated"
    });
    return;
  }
  if (!window.LocalHistoryStore || typeof window.LocalHistoryStore.saveRecord !== "function") {
    setResult({
      at: new Date().toISOString(),
      ok: false,
      reason: "local_history_store_missing"
    });
    return;
  }

  this.sessionSubmitDone = true;
  var endedAt = new Date().toISOString();
  var payload = {
    mode: this.getServerMode(this.modeKey),
    mode_key: this.modeKey,
    board_width: this.width,
    board_height: this.height,
    ruleset: this.ruleset,
    undo_enabled: !!this.modeConfig.undo_enabled,
    ranked_bucket: this.rankedBucket,
    mode_family: this.modeFamily,
    rank_policy: this.rankPolicy,
    special_rules_snapshot: this.clonePlain(this.specialRules || {}),
    challenge_id: this.challengeId || null,
    score: this.score,
    best_tile: this.getBestTileValue(),
    duration_ms: this.getDurationMs(),
    final_board: this.getFinalBoardMatrix(),
    ended_at: endedAt,
    replay: this.serializeV3(),
    replay_string: this.serialize(),
    client_version: (window.GAME_CLIENT_VERSION || "1.8"),
    end_reason: this.over ? "game_over" : "win_stop"
  };

  try {
    var saved = window.LocalHistoryStore.saveRecord(payload);
    setResult({
      at: endedAt,
      ok: true,
      local_saved: true,
      mode_key: payload.mode_key,
      score: payload.score,
      record_id: saved && saved.id ? saved.id : null
    });
  } catch (error) {
    setResult({
      at: endedAt,
      ok: false,
      mode_key: payload.mode_key,
      score: payload.score,
      error: error && error.message ? error.message : "local_save_failed"
    });
  }
};

GameManager.prototype.isSessionTerminated = function () {
  return !!(this.over || (this.won && !this.keepPlaying));
};

GameManager.prototype.serialize = function () {
  if (this.width !== 4 || this.height !== 4 || this.isFibonacciMode()) {
    return JSON.stringify(this.serializeV3());
  }
  var modeToCode = {
    standard_4x4_pow2_no_undo: "S",
    classic_4x4_pow2_undo: "C",
    capped_4x4_pow2_no_undo: "K",
    practice_legacy: "P"
  };
  var modeCode = modeToCode[this.modeKey] || "C";
  var initialBoard = this.initialBoardMatrix || this.getFinalBoardMatrix();
  var encodedBoard = this.encodeBoardV4(initialBoard);
  return GameManager.REPLAY_V4_PREFIX + modeCode + encodedBoard + (this.replayCompactLog || "");
};

GameManager.prototype.import = function (replayString) {
  try {
    var self = this;
    if (typeof replayString !== "string") {
      replayString = JSON.stringify(replayString);
    }

    var trimmed = replayString.trim();
    var decodeMoveSpawnCode = function (rawCode) {
      var dir = (rawCode >> 5) & 3;
      var is4 = (rawCode >> 4) & 1;
      var posIdx = rawCode & 15;
      var x = posIdx % 4;
      var y = Math.floor(posIdx / 4);
      self.replayMoves.push(dir);
      self.replaySpawns.push({ x: x, y: y, value: is4 ? 4 : 2 });
    };

    var startReplay = function () {
      self.replayIndex = 0;
      self.replayDelay = 200;
      self.resume();
    };

    if (trimmed.charAt(0) === "{") {
      var replayObj = JSON.parse(trimmed);
      if (replayObj.v === 3) {
        if (!Array.isArray(replayObj.actions)) throw "Invalid v3 actions";
        var replayModeKey = replayObj.mode_key || replayObj.mode || this.modeKey || this.mode;
        var replayModeConfig = this.resolveModeConfig(replayModeKey);
        if (replayObj.special_rules_snapshot && typeof replayObj.special_rules_snapshot === "object") {
          replayModeConfig.special_rules = this.clonePlain(replayObj.special_rules_snapshot);
        }
        if (typeof replayObj.mode_family === "string" && replayObj.mode_family) {
          replayModeConfig.mode_family = replayObj.mode_family;
        }
        if (typeof replayObj.rank_policy === "string" && replayObj.rank_policy) {
          replayModeConfig.rank_policy = replayObj.rank_policy;
        }
        if (typeof replayObj.challenge_id === "string" && replayObj.challenge_id) {
          this.challengeId = replayObj.challenge_id;
        }
        this.replayMoves = replayObj.actions;
        this.replaySpawns = null;
        this.disableSessionSync = true;
        this.restartWithSeed(replayObj.seed, replayModeConfig);
        this.setUndoEnabled(this.loadUndoSettingForMode(this.modeKey), true, true);
        startReplay();
        return;
      }
      throw "Unsupported JSON replay version";
    }

    var v4Prefix = GameManager.REPLAY_V4_PREFIX;
    if (trimmed.indexOf(v4Prefix) === 0) {
      var body = trimmed.substring(v4Prefix.length);
      if (body.length < 17) throw "Invalid v4C payload";
      var modeCode = body.charAt(0);
      var codeToMode = {
        S: "standard_4x4_pow2_no_undo",
        C: "classic_4x4_pow2_undo",
        K: "capped_4x4_pow2_no_undo",
        P: "practice_legacy"
      };
      var replayModeIdV4 = codeToMode[modeCode];
      if (!replayModeIdV4) throw "Invalid v4C mode";
      var replayModeConfigV4 = this.resolveModeConfig(replayModeIdV4);
      var initialBoardEncoded = body.substring(1, 17);
      var actionsEncoded = body.substring(17);
      var initialBoard = this.decodeBoardV4(initialBoardEncoded);

      this.replayMoves = [];
      this.replaySpawns = [];

      var i = 0;
      while (i < actionsEncoded.length) {
        var token = this.decodeReplay128(actionsEncoded.charAt(i++));
        if (token < 127) {
          decodeMoveSpawnCode(token);
          continue;
        }
        if (i >= actionsEncoded.length) throw "Invalid v4C escape";
        var subtype = this.decodeReplay128(actionsEncoded.charAt(i++));
        if (subtype === 0) {
          decodeMoveSpawnCode(127);
        } else if (subtype === 1) {
          this.replayMoves.push(-1);
          this.replaySpawns.push(null);
        } else if (subtype === 2) {
          if (i + 1 >= actionsEncoded.length) throw "Invalid v4C practice action";
          var cell = this.decodeReplay128(actionsEncoded.charAt(i++));
          var exp = this.decodeReplay128(actionsEncoded.charAt(i++));
          if (cell < 0 || cell > 15) throw "Invalid v4C practice cell";
          var px = (cell >> 2) & 3;
          var py = cell & 3;
          var value = exp === 0 ? 0 : Math.pow(2, exp);
          this.replayMoves.push(["p", px, py, value]);
          this.replaySpawns.push(null);
        } else {
          throw "Unknown v4C escape subtype";
        }
      }

      this.disableSessionSync = true;
      this.restartWithBoard(initialBoard, replayModeConfigV4);
      this.setUndoEnabled(this.loadUndoSettingForMode(this.modeKey), true, true);
      startReplay();
      return;
    }

    if (trimmed.indexOf("REPLAY_v1_") === 0) {
        // Legacy v1 Import
        var v1Parts = trimmed.split("_");
        var seed = parseFloat(v1Parts[2]);
        var movesString = v1Parts[3];
        
        var reverseMapping = { 'U': 0, 'R': 1, 'D': 2, 'L': 3, 'Z': -1 };
        
        this.replayMoves = movesString.split("").map(function (char) {
          var val = reverseMapping[char];
          if (val === undefined) throw "Invalid move char: " + char;
          return val;
        });
        this.replaySpawns = null;
        
        this.restartWithSeed(seed);
        startReplay();
        
    } else if (trimmed.indexOf("REPLAY_v2S_") === 0) {
        // v2S Import (v2 log + explicit initial seed)
        var prefixS = "REPLAY_v2S_";
        var rest = trimmed.substring(prefixS.length);
        var seedSep = rest.indexOf("_");
        if (seedSep < 0) throw "Invalid v2S format";
        var seedS = parseFloat(rest.substring(0, seedSep));
        if (isNaN(seedS)) throw "Invalid v2S seed";
        var logString = rest.substring(seedSep + 1);

        this.replayMovesV2 = logString;
        this.replayMoves = [];
        this.replaySpawns = [];

        for (var i2 = 0; i2 < logString.length; i2++) {
            var code2 = logString.charCodeAt(i2) - 33;
            if (code2 < 0 || code2 > 128) {
                throw "Invalid replay char at index " + i2;
            }
            if (code2 === 128) {
                this.replayMoves.push(-1);
                this.replaySpawns.push(null);
            } else {
                var dir2 = (code2 >> 5) & 3;
                var is42 = (code2 >> 4) & 1;
                var posIdx2 = code2 & 15;
                var x2 = posIdx2 % 4;
                var y2 = Math.floor(posIdx2 / 4);
                this.replayMoves.push(dir2);
                this.replaySpawns.push({x: x2, y: y2, value: is42 ? 4 : 2});
            }
        }

        this.restartWithSeed(seedS);
        startReplay();
    } else if (trimmed.indexOf("REPLAY_v2_") === 0) {
        // v2 Import
        var prefix = "REPLAY_v2_";
        var logString2 = trimmed.substring(prefix.length);
        
        this.replayMovesV2 = logString2; // Store raw string
        this.replayMoves = [];
        this.replaySpawns = [];
        
        for (var i2 = 0; i2 < logString2.length; i2++) {
            var code = logString2.charCodeAt(i2) - 33;
            if (code < 0 || code > 128) {
                throw "Invalid replay char at index " + i2;
            }
            if (code === 128) {
                this.replayMoves.push(-1);
                this.replaySpawns.push(null);
            } else {
                var dir = (code >> 5) & 3;
                var is4 = (code >> 4) & 1;
                var posIdx = code & 15;
                var x = posIdx % 4;
                var y = Math.floor(posIdx / 4);
                
                this.replayMoves.push(dir);
                this.replaySpawns.push({x: x, y: y, value: is4 ? 4 : 2});
            }
        }
        
        this.restartWithSeed(0.123); // Dummy seed
        startReplay();
    } else {
        throw "Unknown replay version";
    }
  } catch (e) {
    alert("导入回放出错: " + e);
  }
};

GameManager.prototype.executeReplayAction = function (action) {
  var kind = this.getActionKind(action);
  if (kind === "m") {
    var dir = Array.isArray(action) ? action[1] : action;
    this.move(dir);
    return;
  }
  if (kind === "u") {
    this.move(-1);
    return;
  }
  if (kind === "p") {
    this.insertCustomTile(action[1], action[2], action[3]);
    return;
  }
  throw "Unknown replay action";
};

GameManager.prototype.pause = function () {
    this.isPaused = true;
    clearInterval(this.replayInterval);
};

GameManager.prototype.resume = function () {
    this.isPaused = false;
    var self = this;
    clearInterval(this.replayInterval);
    
    var delay = this.replayDelay || 200;
    
    this.replayInterval = setInterval(function() {
      if (self.replayIndex >= self.replayMoves.length) {
        self.pause();
        self.replayMode = false;
        return;
      }
      
      var action = self.replayMoves[self.replayIndex];
      
      // Inject Forced Spawn if v2
      if (self.replaySpawns && !Array.isArray(action)) {
          self.forcedSpawn = self.replaySpawns[self.replayIndex];
      }
      
      self.executeReplayAction(action);
      self.replayIndex++;
    }, delay);
};

GameManager.prototype.setSpeed = function (multiplier) {
    this.replayDelay = 200 / multiplier;
    if (!this.isPaused) {
        this.resume(); // Restart interval with new delay
    }
};

GameManager.prototype.seek = function (targetIndex) {
    // Clamp targetIndex
    if (targetIndex < 0) targetIndex = 0;
    if (this.replayMoves && targetIndex > this.replayMoves.length) targetIndex = this.replayMoves.length;

    this.pause(); // Pause while seeking

    if (targetIndex < this.replayIndex) {
        // Rewind implies restart
        if (this.replayStartBoardMatrix) {
            this.restartWithBoard(this.replayStartBoardMatrix, this.modeConfig);
        } else {
            this.restartWithSeed(this.initialSeed, this.modeConfig);
        }
        this.replayIndex = 0;
    }

    // Fast forward to target
    while (this.replayIndex < targetIndex) {
        var action = this.replayMoves[this.replayIndex];
        if (this.replaySpawns && !Array.isArray(action)) {
            this.forcedSpawn = this.replaySpawns[this.replayIndex];
        }
        this.executeReplayAction(action);
        this.replayIndex++;
    }
};

GameManager.prototype.step = function (delta) {
    if (!this.replayMoves) return;
    this.seek(this.replayIndex + delta);
};
