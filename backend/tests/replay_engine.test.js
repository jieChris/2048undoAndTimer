import assert from "node:assert/strict";
import { ReplayEngine } from "../src/replay/engine.js";
import { verifySessionReplay } from "../src/replay/verify.js";

function buildGameOverReplay(seed) {
  const engine = new ReplayEngine({ mode: "classic", seed });
  const actions = [];

  while (!engine.over && actions.length < 20000) {
    let moved = false;
    for (const dir of [0, 1, 2, 3]) {
      const result = engine.move(dir);
      if (result.moved) {
        actions.push(["m", dir]);
        moved = true;
        break;
      }
    }
    if (!moved) {
      break;
    }
  }

  return {
    actions,
    snapshot: engine.snapshot()
  };
}

(function run() {
  const seed = 0.123456;
  const replayData = buildGameOverReplay(seed);
  assert.equal(replayData.snapshot.over, true, "generated replay should end with game over");

  const verify = verifySessionReplay({
    mode: "classic",
    replay: {
      v: 3,
      seed,
      actions: replayData.actions
    },
    clientScore: replayData.snapshot.score,
    clientBestTile: replayData.snapshot.bestTile,
    clientFinalBoard: replayData.snapshot.finalBoard
  });

  assert.equal(verify.ok, true, "valid replay should verify");

  const tampered = verifySessionReplay({
    mode: "classic",
    replay: {
      v: 3,
      seed,
      actions: replayData.actions
    },
    clientScore: replayData.snapshot.score + 2,
    clientBestTile: replayData.snapshot.bestTile,
    clientFinalBoard: replayData.snapshot.finalBoard
  });

  assert.equal(tampered.ok, false, "tampered score should fail");
  assert.equal(tampered.reason, "score_mismatch");

  const capped = new ReplayEngine({ mode: "capped", seed: 0.9, undoEnabled: false });
  assert.throws(
    () => capped.applyReplayV3([["u"]], 100),
    /Undo not allowed in mode/
  );

  const limitedUndo = new ReplayEngine({
    mode: "classic",
    seed: 0.77,
    undoEnabled: true,
    specialRules: { undo_limit: 1 }
  });
  let movedOnce = false;
  for (const dir of [0, 1, 2, 3]) {
    const result = limitedUndo.move(dir);
    if (result.moved) {
      movedOnce = true;
      break;
    }
  }
  assert.equal(movedOnce, true, "limited undo setup should have at least one legal move");
  assert.equal(limitedUndo.undo(), true, "first undo should succeed");
  assert.equal(limitedUndo.undo(), false, "second undo should be blocked by undo_limit");

  const obstacle = new ReplayEngine({
    mode: "classic",
    seed: 0.51,
    specialRules: { blocked_cells: [[1, 1]] }
  });
  assert.equal(obstacle.board[1][1], 0, "blocked cell should remain empty");
  assert.equal(obstacle.availableCells().some((c) => c.x === 1 && c.y === 1), false, "blocked cell should not be spawnable");

  console.log("replay_engine tests passed");
})();
