const MODES = [
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

const INDEX = new Map(MODES.map((mode) => [mode.key, mode]));

const LEGACY_TO_KEY = {
  classic: "classic_4x4_pow2_undo",
  capped: "capped_4x4_pow2_no_undo",
  practice: "practice_legacy"
};

const KEY_TO_LEGACY = {
  standard_4x4_pow2_no_undo: "classic",
  classic_4x4_pow2_undo: "classic",
  capped_4x4_pow2_no_undo: "capped",
  practice_legacy: "practice"
};

export const ALLOWED_BUCKETS = ["standard", "classic_undo", "capped"];

function cloneMode(mode) {
  return JSON.parse(JSON.stringify(mode));
}

export function getModeByKey(key) {
  const mode = INDEX.get(key);
  return mode ? cloneMode(mode) : null;
}

export function modeKeyFromLegacyMode(mode) {
  return LEGACY_TO_KEY[mode] || null;
}

export function legacyModeFromModeKey(modeKey) {
  if (KEY_TO_LEGACY[modeKey]) return KEY_TO_LEGACY[modeKey];
  if (typeof modeKey === "string" && modeKey.includes("capped")) return "capped";
  if (typeof modeKey === "string" && modeKey.includes("practice")) return "practice";
  return "classic";
}

export function resolveModeConfigFromRequest(payload) {
  const requestedKey = payload && typeof payload.mode_key === "string" ? payload.mode_key : null;
  const legacyMode = payload && typeof payload.mode === "string" ? payload.mode : null;
  const fallbackKey = legacyMode ? modeKeyFromLegacyMode(legacyMode) : null;
  const modeKey = requestedKey || fallbackKey;
  if (!modeKey) {
    return { error: "invalid mode_key" };
  }

  const mode = getModeByKey(modeKey);
  if (!mode) {
    return { error: "invalid mode_key" };
  }

  return {
    mode,
    modeKey: mode.key,
    legacyMode: legacyModeFromModeKey(mode.key)
  };
}

export function validateModeBoundFields(payload, mode) {
  if (!payload || !mode) return "invalid mode fields";

  if (payload.board_width !== undefined && Number(payload.board_width) !== mode.board_width) {
    return "board_width mismatch";
  }
  if (payload.board_height !== undefined && Number(payload.board_height) !== mode.board_height) {
    return "board_height mismatch";
  }
  if (payload.ruleset !== undefined && payload.ruleset !== mode.ruleset) {
    return "ruleset mismatch";
  }
  if (payload.undo_enabled !== undefined && Boolean(payload.undo_enabled) !== Boolean(mode.undo_enabled)) {
    return "undo_enabled mismatch";
  }
  if (payload.ranked_bucket !== undefined && payload.ranked_bucket !== mode.ranked_bucket) {
    return "ranked_bucket mismatch";
  }

  return null;
}

export function isAllowedLeaderboardBucket(bucket) {
  return ALLOWED_BUCKETS.includes(bucket);
}

export function listModes() {
  return MODES.map(cloneMode);
}
