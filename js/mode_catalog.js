(function () {
  var MODES = [];

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function getTheoreticalMaxTile(width, height, ruleset) {
    var w = Number(width);
    var h = Number(height);
    if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) return null;
    var cells = Math.floor(w) * Math.floor(h);
    if (!Number.isInteger(cells) || cells <= 0) return null;

    if (ruleset === "fibonacci") {
      // Fibonacci board uses 1,2 starts; 4x4 theoretical top is 4181.
      var targetIndex = cells + 2;
      var a = 1;
      var b = 2;
      if (targetIndex <= 1) return 1;
      if (targetIndex === 2) return 2;
      for (var i = 3; i <= targetIndex; i++) {
        var next = a + b;
        a = b;
        b = next;
      }
      return b;
    }

    // Pow2 board theoretical top follows 2^(cells + 1). 4x4 => 131072.
    return Math.pow(2, cells + 1);
  }

  function createMode(options) {
    var ruleset = options.ruleset === "fibonacci" ? "fibonacci" : "pow2";
    var explicitMaxTile = Number.isInteger(options.max_tile) && options.max_tile > 0
      ? options.max_tile
      : null;
    var inferredMaxTile = getTheoreticalMaxTile(options.board_width, options.board_height, ruleset);
    var defaultMaxTile = ruleset === "fibonacci" ? null : inferredMaxTile;
    return {
      key: options.key,
      label: options.label,
      board_width: options.board_width,
      board_height: options.board_height,
      ruleset: ruleset,
      undo_enabled: !!options.undo_enabled,
      max_tile: explicitMaxTile || defaultMaxTile,
      spawn_table: clone(options.spawn_table || (ruleset === "fibonacci"
        ? [{ value: 1, weight: 90 }, { value: 2, weight: 10 }]
        : [{ value: 2, weight: 90 }, { value: 4, weight: 10 }])),
      ranked_bucket: options.ranked_bucket || "none",
      mode_family: options.mode_family || (ruleset === "fibonacci" ? "fibonacci" : "pow2"),
      special_rules: clone(options.special_rules || {}),
      rank_policy: options.rank_policy || (options.ranked_bucket && options.ranked_bucket !== "none" ? "ranked" : "unranked")
    };
  }

  function add(mode) {
    MODES.push(createMode(mode));
  }

  function addPair(base) {
    add({
      key: base.key + "_undo",
      label: base.label + "（可撤回）",
      board_width: base.board_width,
      board_height: base.board_height,
      ruleset: base.ruleset,
      undo_enabled: true,
      max_tile: base.max_tile,
      spawn_table: base.spawn_table,
      ranked_bucket: base.ranked_bucket || "none",
      mode_family: base.mode_family,
      special_rules: base.special_rules,
      rank_policy: base.rank_policy
    });
    add({
      key: base.key + "_no_undo",
      label: base.label + "（无撤回）",
      board_width: base.board_width,
      board_height: base.board_height,
      ruleset: base.ruleset,
      undo_enabled: false,
      max_tile: base.max_tile,
      spawn_table: base.spawn_table,
      ranked_bucket: base.ranked_bucket || "none",
      mode_family: base.mode_family,
      special_rules: base.special_rules,
      rank_policy: base.rank_policy
    });
  }

  add({
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
    rank_policy: "ranked"
  });

  add({
    key: "classic_4x4_pow2_undo",
    label: "经典版 4x4（可撤回）",
    board_width: 4,
    board_height: 4,
    ruleset: "pow2",
    undo_enabled: true,
    max_tile: null,
    spawn_table: [{ value: 2, weight: 90 }, { value: 4, weight: 10 }],
    ranked_bucket: "classic_undo",
    mode_family: "pow2",
    rank_policy: "ranked"
  });

  add({
    key: "capped_4x4_pow2_no_undo",
    label: "4x4（2048，无撤回）",
    board_width: 4,
    board_height: 4,
    ruleset: "pow2",
    undo_enabled: false,
    max_tile: 2048,
    spawn_table: [{ value: 2, weight: 90 }, { value: 4, weight: 10 }],
    ranked_bucket: "capped",
    mode_family: "pow2",
    rank_policy: "ranked"
  });

  addPair({
    key: "board_3x3_pow2",
    label: "3x3",
    board_width: 3,
    board_height: 3,
    ruleset: "pow2",
    spawn_table: [{ value: 2, weight: 90 }, { value: 4, weight: 10 }],
    mode_family: "pow2",
    rank_policy: "unranked"
  });

  // Keep existing keys for compatibility (3x4 key means board 4x3).
  addPair({
    key: "board_3x4_pow2",
    label: "4x3",
    board_width: 4,
    board_height: 3,
    ruleset: "pow2",
    spawn_table: [{ value: 2, weight: 90 }, { value: 4, weight: 10 }],
    mode_family: "pow2",
    rank_policy: "unranked"
  });

  // Keep existing keys for compatibility (2x4 key means board 4x2).
  addPair({
    key: "board_2x4_pow2",
    label: "4x2",
    board_width: 4,
    board_height: 2,
    ruleset: "pow2",
    spawn_table: [{ value: 2, weight: 90 }, { value: 4, weight: 10 }],
    mode_family: "pow2",
    rank_policy: "unranked"
  });

  addPair({
    key: "fib_4x4",
    label: "Fibonacci 4x4",
    board_width: 4,
    board_height: 4,
    ruleset: "fibonacci",
    spawn_table: [{ value: 1, weight: 90 }, { value: 2, weight: 10 }],
    mode_family: "fibonacci",
    rank_policy: "unranked"
  });

  addPair({
    key: "fib_3x3",
    label: "Fibonacci 3x3",
    board_width: 3,
    board_height: 3,
    ruleset: "fibonacci",
    spawn_table: [{ value: 1, weight: 90 }, { value: 2, weight: 10 }],
    mode_family: "fibonacci",
    rank_policy: "unranked"
  });

  // Phase 1: size ladder 5x5..10x10 (pow2)
  for (var size = 5; size <= 10; size++) {
    addPair({
      key: "board_" + size + "x" + size + "_pow2",
      label: size + "x" + size,
      board_width: size,
      board_height: size,
      ruleset: "pow2",
      spawn_table: [{ value: 2, weight: 90 }, { value: 4, weight: 10 }],
      mode_family: "pow2",
      rank_policy: "unranked"
    });
  }

  // Phase 1: Fibonacci 4x3 / 4x2
  addPair({
    key: "fib_4x3",
    label: "Fibonacci 4x3",
    board_width: 4,
    board_height: 3,
    ruleset: "fibonacci",
    spawn_table: [{ value: 1, weight: 90 }, { value: 2, weight: 10 }],
    mode_family: "fibonacci",
    rank_policy: "unranked"
  });

  addPair({
    key: "fib_4x2",
    label: "Fibonacci 4x2",
    board_width: 4,
    board_height: 2,
    ruleset: "fibonacci",
    spawn_table: [{ value: 1, weight: 90 }, { value: 2, weight: 10 }],
    mode_family: "fibonacci",
    rank_policy: "unranked"
  });

  // Phase 1: extra capped variants
  add({
    key: "capped_4x4_pow2_1024_no_undo",
    label: "封顶版 4x4（1024，无撤回）",
    board_width: 4,
    board_height: 4,
    ruleset: "pow2",
    undo_enabled: false,
    max_tile: 1024,
    spawn_table: [{ value: 2, weight: 90 }, { value: 4, weight: 10 }],
    ranked_bucket: "none",
    mode_family: "pow2",
    rank_policy: "unranked"
  });

  add({
    key: "capped_4x4_pow2_64_no_undo",
    label: "封顶版 4x4（64，无撤回）",
    board_width: 4,
    board_height: 4,
    ruleset: "pow2",
    undo_enabled: false,
    max_tile: 64,
    spawn_table: [{ value: 2, weight: 90 }, { value: 4, weight: 10 }],
    ranked_bucket: "none",
    mode_family: "pow2",
    rank_policy: "unranked"
  });

  add({
    key: "capped_4x4_pow2_4096_no_undo",
    label: "封顶版 4x4（4096，无撤回）",
    board_width: 4,
    board_height: 4,
    ruleset: "pow2",
    undo_enabled: false,
    max_tile: 4096,
    spawn_table: [{ value: 2, weight: 90 }, { value: 4, weight: 10 }],
    ranked_bucket: "none",
    mode_family: "pow2",
    rank_policy: "unranked"
  });

  // Phase 1: spawn probabilities
  addPair({
    key: "spawn95_4x4_pow2",
    label: "4x4 概率 95/5",
    board_width: 4,
    board_height: 4,
    ruleset: "pow2",
    spawn_table: [{ value: 2, weight: 95 }, { value: 4, weight: 5 }],
    mode_family: "pow2",
    rank_policy: "unranked"
  });

  addPair({
    key: "spawn80_4x4_pow2",
    label: "4x4 概率 80/20",
    board_width: 4,
    board_height: 4,
    ruleset: "pow2",
    spawn_table: [{ value: 2, weight: 80 }, { value: 4, weight: 20 }],
    mode_family: "pow2",
    rank_policy: "unranked"
  });

  add({
    key: "spawn50_3x3_pow2_no_undo",
    label: "3x3 概率 50/50（无撤回）",
    board_width: 3,
    board_height: 3,
    ruleset: "pow2",
    undo_enabled: false,
    spawn_table: [{ value: 2, weight: 50 }, { value: 4, weight: 50 }],
    ranked_bucket: "none",
    mode_family: "pow2",
    rank_policy: "unranked"
  });

  // Phase 2: lightweight rule variants
  add({
    key: "limit3_4x4_pow2_undo",
    label: "限次撤回 4x4（3次）",
    board_width: 4,
    board_height: 4,
    ruleset: "pow2",
    undo_enabled: true,
    spawn_table: [{ value: 2, weight: 90 }, { value: 4, weight: 10 }],
    ranked_bucket: "none",
    mode_family: "pow2",
    special_rules: { undo_limit: 3 },
    rank_policy: "unranked"
  });

  add({
    key: "limit5_4x4_pow2_undo",
    label: "限次撤回 4x4（5次）",
    board_width: 4,
    board_height: 4,
    ruleset: "pow2",
    undo_enabled: true,
    spawn_table: [{ value: 2, weight: 90 }, { value: 4, weight: 10 }],
    ranked_bucket: "none",
    mode_family: "pow2",
    special_rules: { undo_limit: 5 },
    rank_policy: "unranked"
  });

  add({
    key: "combo_4x4_pow2_undo",
    label: "连击加分 4x4（可撤回）",
    board_width: 4,
    board_height: 4,
    ruleset: "pow2",
    undo_enabled: true,
    spawn_table: [{ value: 2, weight: 90 }, { value: 4, weight: 10 }],
    ranked_bucket: "none",
    mode_family: "combo",
    special_rules: { combo_multiplier: 1.25 },
    rank_policy: "unranked"
  });

  add({
    key: "dirlock5_4x4_pow2_no_undo",
    label: "方向锁 4x4（每5步锁1方向）",
    board_width: 4,
    board_height: 4,
    ruleset: "pow2",
    undo_enabled: false,
    spawn_table: [{ value: 2, weight: 90 }, { value: 4, weight: 10 }],
    ranked_bucket: "none",
    mode_family: "pow2",
    special_rules: { direction_lock: { every_k_moves: 5 } },
    rank_policy: "unranked"
  });

  add({
    key: "obstacle_4x4_pow2_no_undo",
    label: "障碍块 4x4（无撤回）",
    board_width: 4,
    board_height: 4,
    ruleset: "pow2",
    undo_enabled: false,
    spawn_table: [{ value: 2, weight: 90 }, { value: 4, weight: 10 }],
    ranked_bucket: "none",
    mode_family: "obstacle",
    special_rules: { blocked_cells: [[1, 1], [2, 2]] },
    rank_policy: "unranked"
  });

  add({
    key: "practice_legacy",
    label: "练习板（Legacy）",
    board_width: 4,
    board_height: 4,
    ruleset: "pow2",
    undo_enabled: true,
    max_tile: null,
    spawn_table: [{ value: 2, weight: 90 }, { value: 4, weight: 10 }],
    ranked_bucket: "none",
    mode_family: "pow2",
    rank_policy: "unranked"
  });

  var INDEX = {};
  for (var i = 0; i < MODES.length; i++) {
    INDEX[MODES[i].key] = MODES[i];
  }

  function getMode(key) {
    return INDEX[key] ? clone(INDEX[key]) : null;
  }

  function listModes() {
    var out = [];
    for (var i = 0; i < MODES.length; i++) out.push(clone(MODES[i]));
    return out;
  }

  var api = {
    getMode: getMode,
    listModes: listModes,
    MODES: MODES
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  if (typeof window !== "undefined") {
    window.ModeCatalog = api;
  }
})();
