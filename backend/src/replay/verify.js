import { config } from "../config.js";
import { ReplayEngine } from "./engine.js";
import { boardEquals, isValidBoard } from "../utils/validators.js";
import {
  resolveModeConfigFromRequest,
  validateModeBoundFields,
  legacyModeFromModeKey
} from "../modes/catalog.js";

export function verifySessionReplay({
  mode,
  modeKey,
  boardWidth,
  boardHeight,
  ruleset,
  undoEnabled,
  rankedBucket,
  modeFamily,
  rankPolicy,
  specialRulesSnapshot,
  replay,
  clientScore,
  clientBestTile,
  clientFinalBoard
}) {
  const resolved = resolveModeConfigFromRequest({ mode, mode_key: modeKey });
  if (resolved.error || !resolved.mode) {
    return { ok: false, reason: "invalid_mode" };
  }
  const modeCfg = resolved.mode;

  const modeBoundErr = validateModeBoundFields({
    board_width: boardWidth,
    board_height: boardHeight,
    ruleset,
    undo_enabled: undoEnabled,
    ranked_bucket: rankedBucket,
    mode_family: modeFamily,
    rank_policy: rankPolicy
  }, modeCfg);
  if (modeBoundErr) {
    return { ok: false, reason: modeBoundErr };
  }

  if (!replay || replay.v !== 3) {
    return { ok: false, reason: "unsupported_replay_version" };
  }
  if (typeof replay.seed !== "number" || Number.isNaN(replay.seed)) {
    return { ok: false, reason: "invalid_seed" };
  }
  if (replay.mode_key && replay.mode_key !== modeCfg.key) {
    return { ok: false, reason: "mode_key_mismatch" };
  }
  if (replay.mode && replay.mode !== legacyModeFromModeKey(modeCfg.key)) {
    return { ok: false, reason: "mode_mismatch" };
  }
  if (replay.board_width !== undefined && Number(replay.board_width) !== modeCfg.board_width) {
    return { ok: false, reason: "replay_board_width_mismatch" };
  }
  if (replay.board_height !== undefined && Number(replay.board_height) !== modeCfg.board_height) {
    return { ok: false, reason: "replay_board_height_mismatch" };
  }
  if (replay.ruleset !== undefined && replay.ruleset !== modeCfg.ruleset) {
    return { ok: false, reason: "replay_ruleset_mismatch" };
  }
  if (replay.undo_enabled !== undefined && Boolean(replay.undo_enabled) !== Boolean(modeCfg.undo_enabled)) {
    return { ok: false, reason: "replay_undo_enabled_mismatch" };
  }
  if (replay.mode_family !== undefined && replay.mode_family !== modeCfg.mode_family) {
    return { ok: false, reason: "replay_mode_family_mismatch" };
  }
  if (replay.rank_policy !== undefined && replay.rank_policy !== modeCfg.rank_policy) {
    return { ok: false, reason: "replay_rank_policy_mismatch" };
  }
  if (replay.special_rules_snapshot !== undefined) {
    const expectedRules = specialRulesSnapshot && typeof specialRulesSnapshot === "object"
      ? specialRulesSnapshot
      : modeCfg.special_rules;
    const expectedMode = {
      ...modeCfg,
      special_rules: expectedRules
    };
    const replayBoundErr = validateModeBoundFields({
      special_rules_snapshot: replay.special_rules_snapshot
    }, expectedMode);
    if (replayBoundErr) {
      return { ok: false, reason: `replay_${replayBoundErr.replace(/\s+/g, "_")}` };
    }
  }

  if (!isValidBoard(clientFinalBoard, modeCfg.board_width, modeCfg.board_height, modeCfg.ruleset)) {
    return { ok: false, reason: "invalid_client_final_board" };
  }
  if (!Number.isInteger(clientScore) || clientScore < 0) {
    return { ok: false, reason: "invalid_client_score" };
  }
  if (!Number.isInteger(clientBestTile) || clientBestTile < 0) {
    return { ok: false, reason: "invalid_client_best_tile" };
  }

  try {
    const engineSpecialRules = specialRulesSnapshot && typeof specialRulesSnapshot === "object"
      ? specialRulesSnapshot
      : modeCfg.special_rules;
    const engine = new ReplayEngine({
      mode: legacyModeFromModeKey(modeCfg.key),
      modeKey: modeCfg.key,
      seed: replay.seed,
      boardWidth: modeCfg.board_width,
      boardHeight: modeCfg.board_height,
      ruleset: modeCfg.ruleset,
      spawnTable: modeCfg.spawn_table,
      maxTile: modeCfg.max_tile,
      undoEnabled: modeCfg.undo_enabled,
      modeFamily: modeCfg.mode_family,
      rankPolicy: modeCfg.rank_policy,
      specialRules: engineSpecialRules
    });

    engine.applyReplayV3(replay.actions, config.maxReplayActions);
    const result = engine.snapshot();

    if (!result.over) {
      const canWinStop = modeCfg.ruleset === "pow2" && !modeCfg.max_tile && result.bestTile >= 2048;
      if (!canWinStop) {
        return { ok: false, reason: "not_game_over", computed: result };
      }
    }

    if (result.score !== clientScore) {
      return { ok: false, reason: "score_mismatch", computed: result };
    }
    if (result.bestTile !== clientBestTile) {
      return { ok: false, reason: "best_tile_mismatch", computed: result };
    }
    if (!boardEquals(result.finalBoard, clientFinalBoard, modeCfg.board_width, modeCfg.board_height, modeCfg.ruleset)) {
      return { ok: false, reason: "final_board_mismatch", computed: result };
    }

    return { ok: true, reason: null, computed: result, mode: modeCfg };
  } catch (error) {
    return { ok: false, reason: `replay_invalid:${error.message}` };
  }
}
