function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeSpecialRules(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return clone(value);
}

function createMode(options) {
  const ruleset = options.ruleset === "fibonacci" ? "fibonacci" : "pow2";
  return {
    key: options.key,
    label: options.label,
    board_width: options.board_width,
    board_height: options.board_height,
    ruleset,
    undo_enabled: !!options.undo_enabled,
    max_tile: Number.isInteger(options.max_tile) && options.max_tile > 0 ? options.max_tile : null,
    spawn_table: clone(options.spawn_table || (ruleset === "fibonacci"
      ? [{ value: 1, weight: 90 }, { value: 2, weight: 10 }]
      : [{ value: 2, weight: 90 }, { value: 4, weight: 10 }])),
    ranked_bucket: options.ranked_bucket || "none",
    mode_family: options.mode_family || (ruleset === "fibonacci" ? "fibonacci" : "pow2"),
    special_rules: normalizeSpecialRules(options.special_rules),
    rank_policy: options.rank_policy || (options.ranked_bucket && options.ranked_bucket !== "none" ? "ranked" : "unranked")
  };
}

const MODES = [];

function add(mode) {
  MODES.push(createMode(mode));
}

function addPair(base) {
  add({
    key: `${base.key}_undo`,
    label: `${base.label}（可撤回）`,
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
    key: `${base.key}_no_undo`,
    label: `${base.label}（无撤回）`,
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
  spawn_table: [{ value: 2, weight: 90 }, { value: 4, weight: 10 }],
  ranked_bucket: "classic_undo",
  mode_family: "pow2",
  rank_policy: "ranked"
});

add({
  key: "capped_4x4_pow2_no_undo",
  label: "封顶版 4x4（2048，无撤回）",
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

// Keep existing key naming compatibility.
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

for (let size = 5; size <= 10; size += 1) {
  addPair({
    key: `board_${size}x${size}_pow2`,
    label: `${size}x${size}`,
    board_width: size,
    board_height: size,
    ruleset: "pow2",
    spawn_table: [{ value: 2, weight: 90 }, { value: 4, weight: 10 }],
    mode_family: "pow2",
    rank_policy: "unranked"
  });
}

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
  spawn_table: [{ value: 2, weight: 90 }, { value: 4, weight: 10 }],
  ranked_bucket: "none",
  mode_family: "pow2",
  rank_policy: "unranked"
});

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

function canonicalize(value) {
  if (Array.isArray(value)) {
    return value.map(canonicalize);
  }
  if (!value || typeof value !== "object") {
    return value;
  }
  const out = {};
  const keys = Object.keys(value).sort();
  for (let i = 0; i < keys.length; i += 1) {
    out[keys[i]] = canonicalize(value[keys[i]]);
  }
  return out;
}

function specialRulesEqual(a, b) {
  return JSON.stringify(canonicalize(normalizeSpecialRules(a))) ===
    JSON.stringify(canonicalize(normalizeSpecialRules(b)));
}

export function getModeByKey(key) {
  const mode = INDEX.get(key);
  return mode ? clone(mode) : null;
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
  if (payload.mode_family !== undefined && payload.mode_family !== mode.mode_family) {
    return "mode_family mismatch";
  }
  if (payload.rank_policy !== undefined && payload.rank_policy !== mode.rank_policy) {
    return "rank_policy mismatch";
  }
  if (payload.special_rules !== undefined && !specialRulesEqual(payload.special_rules, mode.special_rules)) {
    return "special_rules mismatch";
  }
  if (payload.special_rules_snapshot !== undefined && !specialRulesEqual(payload.special_rules_snapshot, mode.special_rules)) {
    return "special_rules_snapshot mismatch";
  }

  return null;
}

export function isAllowedLeaderboardBucket(bucket) {
  if (ALLOWED_BUCKETS.includes(bucket)) return true;
  return typeof bucket === "string" && /^seasonal_[a-z0-9_]+$/i.test(bucket);
}

export function listModes() {
  return MODES.map(clone);
}
