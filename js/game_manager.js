function GameManager(size, InputManager, Actuator, ScoreManager) {
  this.size         = size; // Size of the grid
  this.inputManager = new InputManager;
  this.scoreManager = new ScoreManager;
  this.actuator     = new Actuator;
  this.timerContainer = document.querySelector(".timer-container");

  this.startTiles   = 2;

  this.inputManager.on("move", this.move.bind(this));
  this.inputManager.on("restart", this.restart.bind(this));
  this.inputManager.on("keepPlaying", this.keepPlaying.bind(this));

  this.undoStack = [];

  this.setup();
}

// Restart the game
GameManager.prototype.restart = function () {
  if (confirm("是否确认开始新游戏?")) {
      this.actuator.continue();
      this.undoStack = [];
      this.setup();
  }
};

GameManager.prototype.restartWithSeed = function (seed) {
  this.actuator.continue();
  this.setup(seed); // Force setup with specific seed
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
GameManager.prototype.setup = function (inputSeed) {
  this.grid        = new Grid(this.size);

  this.score       = 0;
  this.over        = false;
  this.won         = false;
  this.keepPlaying = false;
  
  // Replay logic
  this.initialSeed = inputSeed || Math.random();
  this.seed        = this.initialSeed;
  this.moveHistory = [];
  this.moveHistory = [];
  this.replayMode  = !!inputSeed; // If seed is provided externally, we might be in replay mode (or just restoring)
  this.replayLog = ""; // For v2 replay
  this.lastSpawn = null; // To capture spawn during play
  this.replayLog = ""; // For v2 replay
  this.lastSpawn = null; // To capture spawn during play
  this.forcedSpawn = null; // To force spawn during replay v2
  
  this.forcedSpawn = null; // To force spawn during replay v2
  
  this.reached32k = false; // Flag for extended timer logic
  this.isTestMode = false; // Flag for Test Board

  this.timerStatus = 0; // 0 = no, 1 = running (reference logic)
  this.startTime = null;
  this.timerID = null;
  this.time = 0;
  this.accumulatedTime = 0; // For pausing logic

  // Stats
  this.totalSpawns = 0;
  this.fours = 0;
  if (this.ipsInterval) clearInterval(this.ipsInterval);
  
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

  // Add the initial tiles
  this.addStartTiles();

  // Update the actuator
  this.actuate();
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
    
    var value = Math.random() < 0.9 ? 2 : 4;
    var cell = this.grid.randomAvailableCell();
    var tile = new Tile(cell, value);

    this.grid.insertTile(tile);
    
    // Record spawn for v2 logging
    this.lastSpawn = { x: cell.x, y: cell.y, value: value };
    
    // Update Stats
    this.totalSpawns++;
    if (value === 4) this.fours++;
    var rateEl = document.getElementById("stats-4-rate");
    if (rateEl && this.totalSpawns > 0) {
        var rate = ((this.fours / this.totalSpawns) * 100).toFixed(2);
        rateEl.textContent = "4率: " + rate + "%"; // Real-time rate
        // Optional: Show theoretical too? User asked "Analysis shows what rate".
        // Use Real-time as requested "Real-time display".
    }
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
  var totalSteps = 0;
  var moveSteps = 0;
  
  // Helper to calculate Net Moves
  var calculateNetMoves = function(moves, limit) {
      var count = 0;
      for (var i = 0; i < limit; i++) {
          if (moves[i] === -1) {
              if (count > 0) count--;
          } else {
              count++;
          }
      }
      return count;
  };
  
  if (this.replayMode && this.replayMoves) {
       totalSteps = this.replayIndex;
       moveSteps = calculateNetMoves(this.replayMoves, this.replayIndex);
  } else {
       totalSteps = this.moveHistory.length;
       moveSteps = calculateNetMoves(this.moveHistory, this.moveHistory.length);
  }
  
  var totalEl = document.getElementById("stats-total");
  if (totalEl) totalEl.textContent = "总步数: " + totalSteps;
  
  var movesEl = document.getElementById("stats-moves");
  if (movesEl) movesEl.textContent = "移动步数: " + moveSteps; // "除撤回外已移动的步数"
  
  // Calculate Undo Steps
  var undoSteps = 0;
  var limit = this.replayMode ? this.replayIndex : this.moveHistory.length;
  var src = this.replayMode ? this.replayMoves : this.moveHistory;
  
  if (src) {
      for (var i = 0; i < limit; i++) {
          if (src[i] === -1) undoSteps++;
      }
  }
  var undoEl = document.getElementById("stats-undo");
  if (undoEl) undoEl.textContent = "撤回步数: " + undoSteps;

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
        ipsEl.textContent = "IPS: " + avgIps;
    }
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
          // Undo in v2: Code 128 (Offset 33+128=161 => ¡)
          this.replayLog += String.fromCharCode(33 + 128); 
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

        // Only one merger per row traversal?
        if (next && next.value === tile.value && !next.mergedFrom) {
          // We need to save tile since it will get removed
          undo.tiles.push(tile.save(positions.next));

          var merged = new Tile(positions.next, tile.value * 2);
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
          if (merged.value === 2048 && document.getElementById("timer2048") && document.getElementById("timer2048").innerHTML === "") {
             self.won = true;
             document.getElementById("timer2048").textContent = timeStr;
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
        if (this.lastSpawn) {
            var valBit = (this.lastSpawn.value === 4) ? 1 : 0;
            var posIdx = this.lastSpawn.x + this.lastSpawn.y * 4;
            var code = (direction << 5) | (valBit << 4) | posIdx;
            this.replayLog += String.fromCharCode(33 + code);
        } else {
             // Moved but no spawn? (Possible if board full but merged?)
             // In 2048 standard, move ALWAYS spawns if cells changed. 
             // If full, merge creates space -> spawn.
             // If full and no merge -> no move.
             // So lastSpawn should exist if moved=true.
             // Fallback: Record just move with dummy spawn 0? Or error?
             // Should not happen.
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

  for (var pos = 0; pos < this.size; pos++) {
    traversals.x.push(pos);
    traversals.y.push(pos);
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

  for (var x = 0; x < this.size; x++) {
    for (var y = 0; y < this.size; y++) {
      tile = this.grid.cellContent({ x: x, y: y });

      if (tile) {
        for (var direction = 0; direction < 4; direction++) {
          var vector = self.getVector(direction);
          var cell   = { x: x + vector.x, y: y + vector.y };

          var other  = self.grid.cellContent(cell);

          if (other && other.value === tile.value) {
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
      // Convert accumulated time back to a start timestamp relative to now
      this.startTime = new Date(Date.now() - (this.accumulatedTime || 0));
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
      ipsEl.textContent = "IPS: " + avgIps;
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
    if (this.grid.cellContent({ x: x, y: y })) {
        // Remove existing if needed? Or just overwrite?
        this.grid.removeTile(this.grid.cellContent({ x: x, y: y }));
    }
    
    // If value is 0, we just want to clear the tile.
    if (value === 0) {
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

GameManager.prototype.serialize = function () {
  // V2 Format
  return "REPLAY_v2_" + this.replayLog;
};

GameManager.prototype.import = function (replayString) {
  try {
    var parts = replayString.split("_");
    if (parts[0] !== "REPLAY") throw "Invalid format";
    
    if (parts[1] === "v1") {
        // Legacy v1 Import
        var seed = parseFloat(parts[2]);
        var movesString = parts[3];
        
        var reverseMapping = { 'U': 0, 'R': 1, 'D': 2, 'L': 3, 'Z': -1 };
        
        this.replayMoves = movesString.split("").map(function (char) {
          var val = reverseMapping[char];
          if (val === undefined) throw "Invalid move char: " + char;
          return val;
        });
        
        this.restartWithSeed(seed);
        this.replayIndex = 0;
        this.replayDelay = 200;
        this.resume();
        
    } else if (parts[1] === "v2") {
        // v2 Import
        var logString = parts[2] || ""; // The rest is the log? Or split logic might cut it if underscore exists?
        // Note: logs use extended chars, underscore is safe? offset 33 includes underscore (95). 
        // Better: join back rest if split by underscore?
        // Actually replayString might contain underscores? 
        // Offset 33 starts at '!', '_' is 95. Range extends to 161.
        // It's safe.
        // But split("_") might be risky if we use '_' char.
        // '_' is char 95. 95-33 = 62.
        // Code 62: bit pattern 00 11 1110 -> Dir 1, Val 1, Pos 14. Possible.
        // So split("_") is risky!
        // We should substring.
        var prefix = "REPLAY_v2_";
        if (replayString.indexOf(prefix) !== 0) throw "Invalid v2 prefix";
        logString = replayString.substring(prefix.length);
        
        this.replayMovesV2 = logString; // Store raw string
        // Decode to moves array for compatibility with step() logic?
        // We need an array of move commands.
        // We can parse it now.
        this.replayMoves = [];
        this.replaySpawns = []; // Store spawns aligned with moves
        
        for (var i=0; i < logString.length; i++) {
            var code = logString.charCodeAt(i) - 33;
            if (code === 128) {
                // Undo
                this.replayMoves.push(-1);
                this.replaySpawns.push(null);
            } else {
                // Move
                // Code = (Dir<<5) | (Is4<<4) | Pos
                var dir = (code >> 5) & 3;
                var is4 = (code >> 4) & 1;
                var posIdx = code & 15;
                var x = posIdx % 4;
                var y = Math.floor(posIdx / 4);
                
                this.replayMoves.push(dir);
                // We need to tell the game to spawn this specific tile AFTER this move.
                // We'll store it in a parallel array or objects.
                this.replaySpawns.push({x: x, y: y, value: is4 ? 4 : 2});
            }
        }
        
        // Start Replay
        // For v2, seed doesn't matter for tiles, but might matter for other things?
        // Actually we control tile spawns explicitly.
        this.restartWithSeed(0.123); // Dummy seed
        this.replayIndex = 0;
        this.replayDelay = 200;
        this.resume();
    } else {
        throw "Unknown version: " + parts[1];
    }
  } catch (e) {
    alert("导入回放出错: " + e);
  }
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
      
      var move = self.replayMoves[self.replayIndex];
      
      // Inject Forced Spawn if v2
      if (self.replaySpawns && self.replaySpawns[self.replayIndex]) {
          self.forcedSpawn = self.replaySpawns[self.replayIndex];
      }
      
      self.move(move);
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
        this.restartWithSeed(this.initialSeed);
        this.replayIndex = 0;
    }

    // Fast forward to target
    while (this.replayIndex < targetIndex) {
        var move = this.replayMoves[this.replayIndex];
        // We perform move without animation delays if possible, but move() is synchronous here logic-wise.
        // However, we want to skip the "move()" triggers that might slow things down? 
        // Actually move() is fast enough.
        this.move(move);
        this.replayIndex++;
    }
};

GameManager.prototype.step = function (delta) {
    if (!this.replayMoves) return;
    this.seek(this.replayIndex + delta);
};
