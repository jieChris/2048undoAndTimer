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

  this.inputManager.on("move", this.move.bind(this));
  this.inputManager.on("restart", this.restart.bind(this));
  this.inputManager.on("keepPlaying", this.keepPlaying.bind(this));

  this.undoStack = [];
  this.initCornerStats();
  this.initStatsPanelUi();

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
  ranked_bucket: "standard"
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
    label: "封顶版 4x4（2048，无撤回）",
    board_width: 4,
    board_height: 4,
    ruleset: "pow2",
    undo_enabled: false,
    max_tile: 2048,
    spawn_table: [{ value: 2, weight: 90 }, { value: 4, weight: 10 }],
    ranked_bucket: "capped"
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
    spawn_table: [{ value: 1, weight: 75 }, { value: 2, weight: 25 }],
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
    spawn_table: [{ value: 1, weight: 75 }, { value: 2, weight: 25 }],
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
    spawn_table: [{ value: 1, weight: 75 }, { value: 2, weight: 25 }],
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
    spawn_table: [{ value: 1, weight: 75 }, { value: 2, weight: 25 }],
    ranked_bucket: "none"
  }
};
GameManager.LEGACY_MODE_BY_KEY = {
  standard_4x4_pow2_no_undo: "classic",
  classic_4x4_pow2_undo: "classic",
  capped_4x4_pow2_no_undo: "capped",
  practice_legacy: "practice"
};

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
    return [{ value: 1, weight: 75 }, { value: 2, weight: 25 }];
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
  if (typeof document !== "undefined" && document.body) {
    document.body.setAttribute("data-mode-id", cfg.key);
    document.body.setAttribute("data-ruleset", cfg.ruleset);
  }
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
    btn.textContent = "统计";
  }
  btn.className = "top-action-btn stats-panel-toggle";
  var exportBtn = document.getElementById("top-export-replay-btn");
  if (exportBtn && exportBtn.parentNode) {
    btn.classList.remove("is-floating");
    if (btn.parentNode !== exportBtn.parentNode || btn.nextSibling !== exportBtn) {
      exportBtn.parentNode.insertBefore(btn, exportBtn);
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
      "<div class='stats-panel-row'><span>出2数量</span><span id='stats-panel-two'>0</span></div>" +
      "<div class='stats-panel-row'><span>出4数量</span><span id='stats-panel-four'>0</span></div>" +
      "<div class='stats-panel-row'><span>实际出4率</span><span id='stats-panel-four-rate'>0.00</span></div>" +
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
    undoBtn.style.visibility = canUndo ? "visible" : "hidden";
  }
};

GameManager.prototype.recordSpawnValue = function (value) {
  this.totalSpawns++;
  if (value === 2) this.spawnTwos++;
  if (value === 4) {
    this.spawnFours++;
    this.fours++;
  }
  this.refreshSpawnRateDisplay();
};

GameManager.prototype.refreshSpawnRateDisplay = function () {
  var rate = 0;
  if (this.totalSpawns > 0) {
    rate = (this.fours / this.totalSpawns) * 100;
  }
  var text = rate.toFixed(2);
  var rateEl = document.getElementById("stats-4-rate");
  if (rateEl) rateEl.textContent = text;
  if (this.cornerRateEl) this.cornerRateEl.textContent = text;
};

GameManager.prototype.getActualFourRate = function () {
  var total = this.spawnTwos + this.spawnFours;
  if (total <= 0) return "0.00";
  return ((this.spawnFours / total) * 100).toFixed(2);
};

GameManager.prototype.updateStatsPanel = function (totalSteps, moveSteps, undoSteps) {
  var fallback = this.computeStepStats();
  if (typeof totalSteps === "undefined") totalSteps = fallback.totalSteps;
  if (typeof moveSteps === "undefined") moveSteps = fallback.moveSteps;
  if (typeof undoSteps === "undefined") undoSteps = fallback.undoSteps;

  var totalEl = document.getElementById("stats-panel-total");
  if (totalEl) totalEl.textContent = String(totalSteps);
  var movesEl = document.getElementById("stats-panel-moves");
  if (movesEl) movesEl.textContent = String(moveSteps);
  var undoEl = document.getElementById("stats-panel-undo");
  if (undoEl) undoEl.textContent = String(undoSteps);
  var twoEl = document.getElementById("stats-panel-two");
  if (twoEl) twoEl.textContent = String(this.spawnTwos || 0);
  var fourEl = document.getElementById("stats-panel-four");
  if (fourEl) fourEl.textContent = String(this.spawnFours || 0);
  var rateEl = document.getElementById("stats-panel-four-rate");
  if (rateEl) rateEl.textContent = this.getActualFourRate();
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
      this.setup();
  }
};

GameManager.prototype.restartWithSeed = function (seed, modeConfig) {
  this.actuator.continue();
  this.setup(seed, { modeConfig: modeConfig }); // Force setup with specific seed
};

GameManager.prototype.restartWithBoard = function (board, modeConfig) {
  this.actuator.continue();
  // Seed is irrelevant here; replay spawns are driven by encoded log.
  this.setup(0, { skipStartTiles: true, modeConfig: modeConfig });
  this.setBoardFromMatrix(board);
  this.initialBoardMatrix = this.getFinalBoardMatrix();
  this.replayStartBoardMatrix = this.cloneBoardMatrix(this.initialBoardMatrix);
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
    seed: this.initialSeed,
    actions: []
  };
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
  this.sessionStartedAt = Date.now();
  this.hasGameStarted = false;

  // Stats
  this.totalSpawns = 0;
  this.fours = 0;
  this.spawnTwos = 0;
  this.spawnFours = 0;
  this.undoEnabled = this.loadUndoSettingForMode(this.mode);
  if (this.ipsInterval) clearInterval(this.ipsInterval);

  var legacyTotalEl = document.getElementById("stats-total");
  if (legacyTotalEl) legacyTotalEl.style.visibility = "hidden";
  var legacyMovesEl = document.getElementById("stats-moves");
  if (legacyMovesEl) legacyMovesEl.style.visibility = "hidden";
  var legacyUndoEl = document.getElementById("stats-undo");
  if (legacyUndoEl) legacyUndoEl.style.visibility = "hidden";
  
  if (document.getElementById("timer")) document.getElementById("timer").textContent = this.pretty(0);
  
  // Clear milestones
  var milestones = [16, 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768];
  milestones.forEach(function(val) {
      var el = document.getElementById("timer" + val);
      if (el) el.textContent = "";
  });
  // Clear sub timers
  var sub8k = document.getElementById("timer8192-sub");
  if (sub8k) sub8k.textContent = "";
  var sub16k = document.getElementById("timer16384-sub");
  if (sub16k) sub16k.textContent = "";
  var subContainer = document.getElementById("timer32k-sub-container");
  if (subContainer) subContainer.style.display = "none";
  // Reset Timer Rows Visibility
  if (document.getElementById("timer-row-16")) document.getElementById("timer-row-16").style.display = "block";
  if (document.getElementById("timer-row-32")) document.getElementById("timer-row-32").style.display = "block";

  // Reset capped mode dynamic timers
  var cappedContainer = document.getElementById("capped-timer-container");
  if (cappedContainer) cappedContainer.innerHTML = "";
  if (typeof window.cappedTimerReset === "function") window.cappedTimerReset();

  // Add the initial tiles unless a replay imports an explicit board.
  var skipStartTiles = !!(options && options.skipStartTiles);
  if (!skipStartTiles) {
    this.addStartTiles();
  }
  this.initialBoardMatrix = this.getFinalBoardMatrix();
  this.refreshSpawnRateDisplay();
  this.updateUndoUiState();
  this.notifyUndoSettingsStateChanged();

  // Update the actuator
  this.actuate();
  this.updateStatsPanel(0, 0, 0);

  if (window.ApiClient && typeof window.ApiClient.flushPendingSessions === "function") {
    window.ApiClient.flushPendingSessions().catch(function () {});
  }
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
      if (this.grid.cellAvailable(this.forcedSpawn)) {
          var tile = new Tile(this.forcedSpawn, this.forcedSpawn.value);
          this.grid.insertTile(tile);
          this.recordSpawnValue(this.forcedSpawn.value);
          this.forcedSpawn = null; // Consumed
      }
      return;
  }
  // Normal Logic
  if (this.grid.cellsAvailable()) {
    Math.seedrandom(this.seed);
    
    // Fix: Use move history length (or replay index) instead of score to determine RNG state.
    // This ensures that Undo -> Move results in a DIFFERENT random tile (because history length increased),
    // while maintaining determinism for Replay.
    var steps = this.replayMode ? this.replayIndex : this.moveHistory.length;
    for (var i=0; i<steps; i++) {
      Math.random();
    }
    
    var value = this.pickSpawnValue();
    var cell = this.grid.randomAvailableCell();
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
    terminated: this.isGameTerminated()
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

  if (this.isSessionTerminated()) {
    this.tryAutoSubmitOnGameOver();
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
      this.over = false;
      this.won = false;
      this.keepPlaying = false;
      this.actuator.clearMessage(); // Clear Game Over message if present
      
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

  var cell, tile;

  var vector     = this.getVector(direction);
  var traversals = this.buildTraversals(vector);
  var moved      = false;
  var undo       = {score: this.score, tiles: []};

  // Save the current tile positions and remove merger information
  this.prepareTiles();

  // Traverse the grid in the right direction and move tiles
  traversals.x.forEach(function (x) {
    traversals.y.forEach(function (y) {
      cell = { x: x, y: y };
      tile = self.grid.cellContent(cell);

      if (tile) {
        var positions = self.findFarthestPosition(cell, vector);
        var next      = self.grid.cellContent(positions.next);

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

          // Milestone Logic (Ported)
          var timeStr = self.pretty(self.time);
          if (merged.value === 16 && document.getElementById("timer16") && document.getElementById("timer16").innerHTML === "") {
             document.getElementById("timer16").textContent = timeStr;
          }
          if (merged.value === 32 && document.getElementById("timer32") && document.getElementById("timer32").innerHTML === "") {
             document.getElementById("timer32").textContent = timeStr;
          }
          if (merged.value === 64 && document.getElementById("timer64") && document.getElementById("timer64").innerHTML === "") {
             document.getElementById("timer64").textContent = timeStr;
          }
          if (merged.value === 128 && document.getElementById("timer128") && document.getElementById("timer128").innerHTML === "") {
             document.getElementById("timer128").textContent = timeStr;
          }
          if (merged.value === 256 && document.getElementById("timer256") && document.getElementById("timer256").innerHTML === "") {
             document.getElementById("timer256").textContent = timeStr;
          }
          if (merged.value === 512 && document.getElementById("timer512") && document.getElementById("timer512").innerHTML === "") {
             document.getElementById("timer512").textContent = timeStr;
          }
          if (merged.value === 1024 && document.getElementById("timer1024") && document.getElementById("timer1024").innerHTML === "") {
             document.getElementById("timer1024").textContent = timeStr;
          }
          if (merged.value === 2048) {
              // Capped mode: track each 2048 merge individually
              if (self.maxTile === 2048) {
                  self.cappedMilestoneCount++;
                  var circled = ["\u2460","\u2461","\u2462","\u2463","\u2464","\u2465","\u2466","\u2467","\u2468","\u2469","\u246a","\u246b","\u246c","\u246d","\u246e","\u246f","\u2470","\u2471","\u2472","\u2473"];
                  var container = document.getElementById("capped-timer-container");

                  if (self.cappedMilestoneCount === 1) {
                      // First 2048: fill the original timer row
                      var t2048 = document.getElementById("timer2048");
                      if (t2048 && t2048.textContent === "") t2048.textContent = timeStr;
                  } else {
                      // Fill the pending row that was created last time
                      var pendingVal = document.getElementById("capped-timer-pending");
                      if (pendingVal) {
                          pendingVal.textContent = timeStr;
                          pendingVal.removeAttribute("id"); // Remove pending marker
                      }
                  }

                  // Always create the NEXT empty timer row as a target
                  if (container) {
                      var nextIdx = self.cappedMilestoneCount + 1;
                      var nextLabel = "2048" + (circled[nextIdx - 1] || "(" + nextIdx + ")");
                      var rowDiv = document.createElement("div");
                      rowDiv.className = "timer-row-item";
                      var legend = document.createElement("div");
                      legend.className = "timertile timer-legend-2048";
                      legend.style.cssText = "color: #f9f6f2; font-size: 13px;";
                      legend.textContent = nextLabel;
                      var val = document.createElement("div");
                      val.className = "timertile";
                      val.id = "capped-timer-pending";
                      val.style.cssText = "margin-left:6px; width:159px;";
                      val.textContent = "";
                      rowDiv.appendChild(legend);
                      rowDiv.appendChild(val);
                      rowDiv.appendChild(document.createElement("br"));
                      rowDiv.appendChild(document.createElement("br"));
                      container.appendChild(rowDiv);
                      // Auto-scroll to show the latest timer row
                      if (typeof window.cappedTimerAutoScroll === "function") window.cappedTimerAutoScroll();
                  }
                  // No self.won = true: capped mode continues without "you win" prompt
              } else {
                  if (document.getElementById("timer2048") && document.getElementById("timer2048").innerHTML === "") {
                      self.won = true;
                      document.getElementById("timer2048").textContent = timeStr;
                  }
              }
          }
          if (merged.value === 4096 && document.getElementById("timer4096") && document.getElementById("timer4096").innerHTML === "") {
             document.getElementById("timer4096").textContent = timeStr;
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
    this.addRandomTile();

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
           this.grid.cellAvailable(cell));

  return {
    farthest: previous,
    next: cell // Used to check if a merge is required
  };
};

GameManager.prototype.movesAvailable = function () {
  return this.grid.cellsAvailable() || this.tileMatchesAvailable();
};

// Check for available matches between tiles (more expensive check)
GameManager.prototype.tileMatchesAvailable = function () {
  var self = this;

  var tile;

  for (var x = 0; x < this.width; x++) {
    for (var y = 0; y < this.height; y++) {
      tile = this.grid.cellContent({ x: x, y: y });

      if (tile) {
        for (var direction = 0; direction < 4; direction++) {
          var vector = self.getVector(direction);
          var cell   = { x: x + vector.x, y: y + vector.y };

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
      this.timerID = setInterval(function() {
          self.updateTimer();
      }, 10);
  }
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
  this.updateStatsPanel();
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
    var milestones = [16, 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768];
    milestones.forEach(function(val) {
        if (val <= limit) {
             var el = document.getElementById("timer" + val);
             if (el) {
                 el.textContent = "---------";
                 // Also ensure it doesn't get overwritten later? 
                 // The move logic checks 'if (el.innerHTML === "")'. 
                 // Now it is "---------", so it won't be overwritten. Correct.
             }
        }
    });
    
    // 8k/16k sub-timers logic
    // Only invalidate sub-timers if we have actually reached the 32k phase.
    if (this.reached32k) {
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
    seed: replay.seed,
    actions: replay.actions.slice()
  };
};

GameManager.prototype.tryAutoSubmitOnGameOver = function () {
  var self = this;
  function setSkip(reason) {
    try {
      localStorage.setItem("last_session_submit_result_v1", JSON.stringify({
        at: new Date().toISOString(),
        ok: false,
        skipped: true,
        reason: reason
      }));
    } catch (_err) {}
  }

  if (this.sessionSubmitDone) return;
  if (this.replayMode) { setSkip("replay_mode"); return; }
  if (this.disableSessionSync) { setSkip("sync_disabled"); return; }
  if (!this.isSessionTerminated()) { setSkip("not_terminated"); return; }
  if (!window.ApiClient || typeof window.ApiClient.completeSession !== "function") { setSkip("api_client_missing"); return; }

  this.sessionSubmitDone = true;
  var payload = {
    mode: this.getServerMode(this.modeKey),
    mode_key: this.modeKey,
    board_width: this.width,
    board_height: this.height,
    ruleset: this.ruleset,
    undo_enabled: !!this.modeConfig.undo_enabled,
    ranked_bucket: this.rankedBucket,
    score: this.score,
    best_tile: this.getBestTileValue(),
    duration_ms: this.getDurationMs(),
    final_board: this.getFinalBoardMatrix(),
    ended_at: new Date().toISOString(),
    replay: this.serializeV3(),
    client_version: (window.GAME_CLIENT_VERSION || "1.61"),
    end_reason: this.over ? "game_over" : "win_stop"
  };

  window.ApiClient.completeSession(payload)
    .then(function (res) {
      try {
        localStorage.setItem("last_session_submit_result_v1", JSON.stringify({
          at: new Date().toISOString(),
          ok: true,
          queued: !!(res && res.queued),
          mode: payload.mode,
          score: payload.score,
          end_reason: payload.end_reason,
          skip_state: {
            replayMode: self.replayMode,
            disableSessionSync: self.disableSessionSync
          }
        }));
      } catch (_err) {}
    })
    .catch(function (error) {
      try {
        localStorage.setItem("last_session_submit_result_v1", JSON.stringify({
          at: new Date().toISOString(),
          ok: false,
          mode: payload.mode,
          score: payload.score,
          end_reason: payload.end_reason,
          error: error && error.message ? error.message : "submit_failed"
        }));
      } catch (_err2) {}
    });
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
