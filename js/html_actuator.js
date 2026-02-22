function HTMLActuator() {
  this.tileContainer = document.querySelector(".tile-container");
  this.scoreContainer = document.querySelector(".score-container");
  this.bestContainer = document.querySelector(".best-container");
  this.messageContainer = document.querySelector(".game-message");
  this.gridContainer = document.querySelector(".grid-container");
  this.gameContainer = document.querySelector(".game-container");

  this.score = 0;
  this.gridMeta = null;
  this.lowPerfMode = false;
}

HTMLActuator.prototype.actuate = function (grid, metadata) {
  var self = this;

  window.requestAnimationFrame(function () {
    self.ensureGridLayout(grid, metadata);
    self.clearContainer(self.tileContainer);

    grid.cells.forEach(function (column) {
      column.forEach(function (cell) {
        if (cell) {
          self.addTile(cell);
        }
      });
    });

    self.updateScore(metadata.score);
    self.updateBestScore(metadata.bestScore);

    if (metadata.terminated) {
      if (metadata.over) {
        self.message(false);
      } else if (metadata.won) {
        self.message(true);
      }
    }
  });
};

HTMLActuator.prototype.ensureGridLayout = function (grid, metadata) {
  if (!this.gridContainer || !this.tileContainer) return;

  var cols = grid.width || grid.size || 4;
  var rows = grid.height || grid.size || 4;
  var blockedCells = metadata && Array.isArray(metadata.blockedCells) ? metadata.blockedCells : [];
  var blockedSignature = blockedCells.length ? JSON.stringify(blockedCells) : "";
  var boardSize = 470;
  if (this.gameContainer && this.gameContainer.clientWidth > 80 && typeof window !== "undefined") {
    var styles = window.getComputedStyle(this.gameContainer);
    var padLeft = parseFloat(styles.paddingLeft) || 0;
    var padRight = parseFloat(styles.paddingRight) || 0;
    boardSize = Math.max(120, this.gameContainer.clientWidth - padLeft - padRight);
  }
  var cached = this.gridMeta;
  if (cached && cached.cols === cols && cached.rows === rows && cached.boardSize === boardSize && cached.blockedSignature === blockedSignature) {
    return;
  }

  var desktopLike = boardSize >= 400;
  var baseGap = desktopLike ? 15 : 10;
  var layout = this.getBoardLayout(cols, rows, boardSize, baseGap);
  var cell = layout.cell;
  var gap = layout.gap;
  var gridWidth = layout.gridWidth;
  var gridHeight = layout.gridHeight;
  var offsetX = layout.offsetX;
  var offsetY = layout.offsetY;

  this.applyContainerFrameSize(cols, rows, gridHeight);

  this.gridMeta = {
    cols: cols,
    rows: rows,
    cell: cell,
    gap: gap,
    gridWidth: gridWidth,
    gridHeight: gridHeight,
    offsetX: offsetX,
    offsetY: offsetY,
    boardSize: boardSize,
    blockedSignature: blockedSignature
  };

  var lowPerf = cols * rows >= 64;
  if (this.lowPerfMode !== lowPerf) {
    this.lowPerfMode = lowPerf;
    if (typeof document !== "undefined" && document.body) {
      document.body.classList.toggle("board-low-perf", lowPerf);
    }
  }

  this.gridContainer.style.left = "50%";
  this.gridContainer.style.top = "50%";
  this.gridContainer.style.width = gridWidth + "px";
  this.gridContainer.style.height = gridHeight + "px";
  this.gridContainer.style.transform = "translate(-50%, -50%)";

  this.tileContainer.style.left = "50%";
  this.tileContainer.style.top = "50%";
  this.tileContainer.style.width = gridWidth + "px";
  this.tileContainer.style.height = gridHeight + "px";
  this.tileContainer.style.transform = "translate(-50%, -50%)";

  this.gridContainer.innerHTML = "";
  var blockedMap = {};
  for (var b = 0; b < blockedCells.length; b++) {
    var bc = blockedCells[b];
    if (!bc) continue;
    blockedMap[bc.x + ":" + bc.y] = true;
  }
  for (var y = 0; y < rows; y++) {
    var rowEl = document.createElement("div");
    rowEl.className = "grid-row";
    rowEl.style.marginBottom = (y === rows - 1) ? "0" : (gap + "px");
    for (var x = 0; x < cols; x++) {
      var cellEl = document.createElement("div");
      cellEl.className = "grid-cell";
      cellEl.style.width = cell + "px";
      cellEl.style.height = cell + "px";
      cellEl.style.marginRight = (x === cols - 1) ? "0" : (gap + "px");
      cellEl.setAttribute("data-x", x);
      cellEl.setAttribute("data-y", y);
      if (blockedMap[x + ":" + y]) {
        cellEl.classList.add("grid-cell-obstacle");
      }
      rowEl.appendChild(cellEl);
    }
    this.gridContainer.appendChild(rowEl);
  }
};

HTMLActuator.prototype.invalidateLayoutCache = function () {
  this.gridMeta = null;
};

HTMLActuator.prototype.applyContainerFrameSize = function (cols, rows, gridHeight) {
  if (!this.gameContainer || typeof window === "undefined") return;

  var styles = window.getComputedStyle(this.gameContainer);
  var padTop = parseFloat(styles.paddingTop) || 0;
  var padBottom = parseFloat(styles.paddingBottom) || 0;

  if (cols === 4 && rows < 4) {
    this.gameContainer.style.height = (gridHeight + padTop + padBottom) + "px";
  } else {
    this.gameContainer.style.height = "";
  }
};

HTMLActuator.prototype.getBoardLayout = function (cols, rows, boardSize, baseGap) {
  if (cols === 4 && rows === 4) {
    var cell44 = (boardSize - baseGap * (cols - 1)) / cols;
    return {
      gap: baseGap,
      cell: cell44,
      gridWidth: cols * cell44 + (cols - 1) * baseGap,
      gridHeight: rows * cell44 + (rows - 1) * baseGap,
      offsetX: 0,
      offsetY: 0
    };
  }

  // 非 4x4 单独布局：按“仅内部间距”计算，再居中。
  var cellByRows = (boardSize - baseGap * (rows - 1)) / rows;
  var cellByCols = (boardSize - baseGap * (cols - 1)) / cols;
  var cell = Math.min(cellByRows, cellByCols);
  if (rows === 3 && cols === 3) {
    cell = cellByCols; // 3x3 允许更饱满展示
  }
  if (!isFinite(cell) || cell < 10) {
    cell = 10;
  }

  var gridWidth = cols * cell + (cols - 1) * baseGap;
  var gridHeight = rows * cell + (rows - 1) * baseGap;
  var offsetX = Math.max(0, (boardSize - gridWidth) / 2);
  var offsetY = Math.max(0, (boardSize - gridHeight) / 2);

  return {
    gap: baseGap,
    cell: cell,
    gridWidth: gridWidth,
    gridHeight: gridHeight,
    offsetX: offsetX,
    offsetY: offsetY
  };
};

// Continues the game (both restart and keep playing)
HTMLActuator.prototype.continue = function () {
  this.clearMessage();
};

HTMLActuator.prototype.clearContainer = function (container) {
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }
};

HTMLActuator.prototype.applyTileStyle = function (wrapper, inner, position, value) {
  var meta = this.gridMeta || { cell: 107, gap: 15 };
  var x = position.x * (meta.cell + meta.gap);
  var y = position.y * (meta.cell + meta.gap);
  var fontSize = Math.max(14, Math.floor(meta.cell * 0.48));
  var len = String(value).length;
  if (len >= 4) fontSize = Math.floor(fontSize * 0.78);
  if (len >= 5) fontSize = Math.floor(fontSize * 0.68);

  wrapper.style.width = meta.cell + "px";
  wrapper.style.height = meta.cell + "px";
  wrapper.style.transform = "translate(" + x + "px, " + y + "px)";

  inner.style.width = meta.cell + "px";
  inner.style.height = meta.cell + "px";
  inner.style.lineHeight = meta.cell + "px";
  inner.style.fontSize = fontSize + "px";
};

HTMLActuator.prototype.addTile = function (tile, isMergedInner) {
  var self = this;

  var wrapper = document.createElement("div");
  var inner = document.createElement("div");
  var position = tile.previousPosition || { x: tile.x, y: tile.y };
  var positionClass = this.positionClass(position);

  var classes = ["tile", "tile-" + tile.value, positionClass];
  if (tile.value > 2048) classes.push("tile-super");

  if (isMergedInner) {
    classes.push("tile-tobe-merged");
  }

  this.applyClasses(wrapper, classes);

  inner.classList.add("tile-inner");
  inner.textContent = tile.value;
  this.applyTileStyle(wrapper, inner, position, tile.value);

  if (tile.previousPosition) {
    if (this.lowPerfMode) {
      classes[2] = self.positionClass({ x: tile.x, y: tile.y });
      self.applyClasses(wrapper, classes);
      self.applyTileStyle(wrapper, inner, { x: tile.x, y: tile.y }, tile.value);
    } else {
      window.requestAnimationFrame(function () {
        classes[2] = self.positionClass({ x: tile.x, y: tile.y });
        self.applyClasses(wrapper, classes);
        self.applyTileStyle(wrapper, inner, { x: tile.x, y: tile.y }, tile.value);
      });
    }
  } else if (tile.mergedFrom) {
    if (!this.lowPerfMode) {
      classes.push("tile-merged");
      this.applyClasses(wrapper, classes);

      tile.mergedFrom.forEach(function (merged) {
        self.addTile(merged, true);
      });
    }
  } else {
    if (!this.lowPerfMode) {
      classes.push("tile-new");
    }
    this.applyClasses(wrapper, classes);
  }

  wrapper.appendChild(inner);
  this.tileContainer.appendChild(wrapper);
};

HTMLActuator.prototype.applyClasses = function (element, classes) {
  element.setAttribute("class", classes.join(" "));
};

HTMLActuator.prototype.normalizePosition = function (position) {
  return { x: position.x + 1, y: position.y + 1 };
};

HTMLActuator.prototype.positionClass = function (position) {
  position = this.normalizePosition(position);
  return "tile-position-" + position.x + "-" + position.y;
};

HTMLActuator.prototype.updateScore = function (score) {
  this.clearContainer(this.scoreContainer);

  var difference = score - this.score;
  this.score = score;

  this.scoreContainer.textContent = this.score;

  if (difference > 0) {
    var addition = document.createElement("div");
    addition.classList.add("score-addition");
    addition.textContent = "+" + difference;

    this.scoreContainer.appendChild(addition);
  }
};

HTMLActuator.prototype.updateBestScore = function (bestScore) {
  this.bestContainer.textContent = bestScore;
};

HTMLActuator.prototype.message = function (won) {
  var type = won ? "game-won" : "game-over";
  var message = won ? "你赢了！" : "游戏结束！";

  this.messageContainer.classList.add(type);
  this.messageContainer.getElementsByTagName("p")[0].textContent = message;
};

HTMLActuator.prototype.clearMessage = function () {
  this.messageContainer.classList.remove("game-won");
  this.messageContainer.classList.remove("game-over");
};
