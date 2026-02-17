import seedrandom from "seedrandom";
import { isValidTileValue } from "../utils/validators.js";

const DIR_MAP = {
  0: { x: 0, y: -1 },
  1: { x: 1, y: 0 },
  2: { x: 0, y: 1 },
  3: { x: -1, y: 0 }
};

function boardKey(x, y) {
  return `${x}:${y}`;
}

function cloneBoard(board) {
  return board.map((column) => column.slice());
}

export class ReplayEngine {
  constructor({
    mode,
    modeKey,
    seed,
    boardWidth,
    boardHeight,
    ruleset,
    spawnTable,
    maxTile,
    undoEnabled
  }) {
    this.mode = mode || "classic";
    this.modeKey = modeKey || null;
    this.width = Number.isInteger(boardWidth) && boardWidth > 0 ? boardWidth : 4;
    this.height = Number.isInteger(boardHeight) && boardHeight > 0 ? boardHeight : 4;
    this.ruleset = ruleset === "fibonacci" ? "fibonacci" : "pow2";
    this.spawnTable = Array.isArray(spawnTable) && spawnTable.length
      ? spawnTable.map((item) => ({ value: Number(item.value), weight: Number(item.weight) }))
      : this.ruleset === "fibonacci"
        ? [{ value: 1, weight: 75 }, { value: 2, weight: 25 }]
        : [{ value: 2, weight: 90 }, { value: 4, weight: 10 }];
    this.maxTile = Number.isInteger(maxTile) && maxTile > 0 ? maxTile : Number.POSITIVE_INFINITY;
    this.undoEnabled = typeof undoEnabled === "boolean" ? undoEnabled : true;
    this.isPracticeMode = this.mode === "practice" || this.modeKey === "practice_legacy";

    this.seed = seed;
    this.score = 0;
    this.over = false;
    this.moveHistory = [];
    this.undoStack = [];
    this.board = Array.from({ length: this.width }, () => Array(this.height).fill(0));
    this.addStartTiles();
  }

  addStartTiles() {
    this.addRandomTile();
    this.addRandomTile();
  }

  availableCells() {
    const cells = [];
    for (let x = 0; x < this.width; x += 1) {
      for (let y = 0; y < this.height; y += 1) {
        if (this.board[x][y] === 0) {
          cells.push({ x, y });
        }
      }
    }
    return cells;
  }

  pickSpawnValue(rng) {
    const table = this.spawnTable;
    let totalWeight = 0;
    for (let i = 0; i < table.length; i += 1) {
      totalWeight += table[i].weight;
    }
    if (totalWeight <= 0) return table[0].value;

    const pick = rng() * totalWeight;
    let running = 0;
    for (let i = 0; i < table.length; i += 1) {
      running += table[i].weight;
      if (pick <= running) return table[i].value;
    }
    return table[table.length - 1].value;
  }

  addRandomTile() {
    const cells = this.availableCells();
    if (cells.length === 0) return;

    const steps = this.moveHistory.length;
    const rng = seedrandom(String(this.seed));
    for (let i = 0; i < steps; i += 1) {
      rng();
    }

    const value = this.pickSpawnValue(rng);
    const cell = cells[Math.floor(rng() * cells.length)];
    this.board[cell.x][cell.y] = value;
  }

  withinBounds(cell) {
    return cell.x >= 0 && cell.x < this.width && cell.y >= 0 && cell.y < this.height;
  }

  buildTraversals(vector) {
    const traversals = {
      x: Array.from({ length: this.width }, (_x, idx) => idx),
      y: Array.from({ length: this.height }, (_y, idx) => idx)
    };
    if (vector.x === 1) traversals.x.reverse();
    if (vector.y === 1) traversals.y.reverse();
    return traversals;
  }

  findFarthestPosition(cell, vector) {
    let previous;
    let current = { ...cell };

    do {
      previous = current;
      current = { x: previous.x + vector.x, y: previous.y + vector.y };
    } while (this.withinBounds(current) && this.board[current.x][current.y] === 0);

    return {
      farthest: previous,
      next: current
    };
  }

  nextFibonacci(value) {
    if (value <= 0) return 1;
    if (value === 1) return 2;
    let a = 1;
    let b = 2;
    while (b < value) {
      const n = a + b;
      a = b;
      b = n;
    }
    return b === value ? a + b : null;
  }

  mergedValue(a, b) {
    if (!Number.isInteger(a) || !Number.isInteger(b) || a <= 0 || b <= 0) return null;

    if (this.ruleset !== "fibonacci") {
      if (a !== b) return null;
      const merged = a * 2;
      if (merged > this.maxTile) return null;
      return merged;
    }

    if (a === 1 && b === 1) {
      if (2 > this.maxTile) return null;
      return 2;
    }

    const low = Math.min(a, b);
    const high = Math.max(a, b);
    const next = this.nextFibonacci(low);
    if (next !== high) return null;
    const merged = low + high;
    if (merged > this.maxTile) return null;
    return merged;
  }

  tileMatchesAvailable() {
    for (let x = 0; x < this.width; x += 1) {
      for (let y = 0; y < this.height; y += 1) {
        const tile = this.board[x][y];
        if (tile === 0) continue;

        for (let direction = 0; direction < 4; direction += 1) {
          const vector = DIR_MAP[direction];
          const next = { x: x + vector.x, y: y + vector.y };
          if (!this.withinBounds(next)) continue;
          const other = this.board[next.x][next.y];
          if (other !== 0 && this.mergedValue(tile, other) !== null) {
            return true;
          }
        }
      }
    }
    return false;
  }

  movesAvailable() {
    return this.availableCells().length > 0 || this.tileMatchesAvailable();
  }

  undo() {
    if (!this.undoEnabled) return false;
    if (this.undoStack.length === 0) return false;

    const prev = this.undoStack.pop();
    this.board = cloneBoard(prev.board);
    this.score = prev.score;
    this.over = false;
    this.moveHistory.push(-1);
    return true;
  }

  move(direction) {
    if (![0, 1, 2, 3].includes(direction)) {
      throw new Error("Invalid move direction");
    }
    if (this.over) {
      return { moved: false, reason: "game_over" };
    }

    const vector = DIR_MAP[direction];
    const traversals = this.buildTraversals(vector);
    const mergedTargets = new Set();

    let moved = false;
    const undoSnapshot = {
      score: this.score,
      board: cloneBoard(this.board)
    };

    traversals.x.forEach((x) => {
      traversals.y.forEach((y) => {
        const value = this.board[x][y];
        if (value === 0) return;

        const positions = this.findFarthestPosition({ x, y }, vector);
        const next = positions.next;

        if (this.withinBounds(next)) {
          const nextValue = this.board[next.x][next.y];
          const mergedKey = boardKey(next.x, next.y);
          const mergedValue = this.mergedValue(value, nextValue);
          if (nextValue !== 0 && mergedValue !== null && !mergedTargets.has(mergedKey)) {
            this.board[x][y] = 0;
            this.board[next.x][next.y] = mergedValue;
            mergedTargets.add(mergedKey);
            this.score += mergedValue;
            moved = true;
            return;
          }
        }

        if (positions.farthest.x !== x || positions.farthest.y !== y) {
          this.board[x][y] = 0;
          this.board[positions.farthest.x][positions.farthest.y] = value;
          moved = true;
        }
      });
    });

    if (!moved) {
      return { moved: false };
    }

    this.addRandomTile();
    if (!this.movesAvailable()) {
      this.over = true;
    }

    this.undoStack.push(undoSnapshot);
    this.moveHistory.push(direction);
    return { moved: true };
  }

  insertPracticeTile(x, y, value) {
    if (!this.isPracticeMode) {
      throw new Error("Practice tile action is only allowed in practice mode");
    }
    if (!Number.isInteger(x) || !Number.isInteger(y) || x < 0 || x >= this.width || y < 0 || y >= this.height) {
      throw new Error("Invalid practice coordinates");
    }
    if (!isValidTileValue(value, this.ruleset)) {
      throw new Error("Invalid practice tile value");
    }
    this.board[x][y] = value;
    return true;
  }

  applyReplayV3(actions, maxActions) {
    if (!Array.isArray(actions)) {
      throw new Error("Replay actions must be an array");
    }
    if (actions.length > maxActions) {
      throw new Error("Replay actions exceed max length");
    }

    for (let i = 0; i < actions.length; i += 1) {
      const action = actions[i];
      if (!Array.isArray(action) || action.length < 1) {
        throw new Error(`Invalid action at ${i}`);
      }
      if (this.over) {
        throw new Error(`Action after game over at index ${i}`);
      }

      const [type, a, b, c] = action;
      if (type === "m") {
        const dir = Number(a);
        const result = this.move(dir);
        if (!result.moved) {
          throw new Error(`Illegal no-op move at index ${i}`);
        }
      } else if (type === "u") {
        if (!this.undoEnabled) {
          throw new Error(`Undo not allowed in mode at index ${i}`);
        }
        const ok = this.undo();
        if (!ok) {
          throw new Error(`Illegal undo at index ${i}`);
        }
      } else if (type === "p") {
        if (!this.isPracticeMode) {
          throw new Error(`Practice action in non-practice mode at index ${i}`);
        }
        this.insertPracticeTile(Number(a), Number(b), Number(c));
      } else {
        throw new Error(`Unknown action type at index ${i}`);
      }
    }
  }

  bestTile() {
    let max = 0;
    for (let x = 0; x < this.width; x += 1) {
      for (let y = 0; y < this.height; y += 1) {
        if (this.board[x][y] > max) max = this.board[x][y];
      }
    }
    return max;
  }

  finalBoardMatrix() {
    const rows = [];
    for (let y = 0; y < this.height; y += 1) {
      const row = [];
      for (let x = 0; x < this.width; x += 1) {
        row.push(this.board[x][y]);
      }
      rows.push(row);
    }
    return rows;
  }

  snapshot() {
    return {
      score: this.score,
      bestTile: this.bestTile(),
      finalBoard: this.finalBoardMatrix(),
      over: this.over
    };
  }
}
