(function () {
  var MODES = [
    {
      key: "standard_4x4_pow2_no_undo",
      label: "标准版 4x4（无撤回）",
      board_width: 4,
      board_height: 4,
      ruleset: "pow2",
      undo_enabled: false,
      max_tile: null,
      spawn_table: [{ value: 2, weight: 90 }, { value: 4, weight: 10 }],
      ranked_bucket: "standard"
    },
    {
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
    {
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
    {
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
    {
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
    {
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
    {
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
    {
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
    {
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
    {
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
    {
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
    {
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
    {
      key: "fib_3x3_no_undo",
      label: "Fibonacci 3x3（无撤回）",
      board_width: 3,
      board_height: 3,
      ruleset: "fibonacci",
      undo_enabled: false,
      max_tile: null,
      spawn_table: [{ value: 1, weight: 75 }, { value: 2, weight: 25 }],
      ranked_bucket: "none"
    },
    {
      key: "practice_legacy",
      label: "练习板（Legacy）",
      board_width: 4,
      board_height: 4,
      ruleset: "pow2",
      undo_enabled: true,
      max_tile: null,
      spawn_table: [{ value: 2, weight: 90 }, { value: 4, weight: 10 }],
      ranked_bucket: "none"
    }
  ];

  var INDEX = {};
  for (var i = 0; i < MODES.length; i++) {
    INDEX[MODES[i].key] = MODES[i];
  }

  function cloneMode(mode) {
    return JSON.parse(JSON.stringify(mode));
  }

  function getMode(key) {
    return INDEX[key] ? cloneMode(INDEX[key]) : null;
  }

  function listModes() {
    var out = [];
    for (var i = 0; i < MODES.length; i++) out.push(cloneMode(MODES[i]));
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
