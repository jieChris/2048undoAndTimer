(function () {
  function el(id) {
    return document.getElementById(id);
  }

  var state = {
    page: 1,
    pageSize: 30,
    modeKey: "",
    keyword: "",
    sortBy: "ended_desc"
  };

  function setStatus(text, isError) {
    var status = el("history-status");
    if (!status) return;
    status.textContent = text || "";
    status.style.color = isError ? "#c0392b" : "#4a4a4a";
  }

  function boardToHtml(board, width, height) {
    if (!Array.isArray(board) || !board.length) return "";
    var h = Number.isInteger(height) && height > 0 ? height : board.length;
    var w = Number.isInteger(width) && width > 0 ? width : (Array.isArray(board[0]) ? board[0].length : 0);
    if (w <= 0 || h <= 0) return "";

    var style = "grid-template-columns: repeat(" + w + ", 48px); grid-template-rows: repeat(" + h + ", 48px);";
    var html = "<div class='final-board-grid' style='" + style + "'>";
    for (var y = 0; y < h; y++) {
      var row = Array.isArray(board[y]) ? board[y] : [];
      for (var x = 0; x < w; x++) {
        var v = row[x] || 0;
        var valueClass = v === 0 ? "final-board-cell-empty" : ("final-board-cell-v-" + v);
        var superClass = v > 2048 ? " final-board-cell-super" : "";
        html += "<div class='final-board-cell " + valueClass + superClass + "'>" + (v === 0 ? "" : v) + "</div>";
      }
    }
    html += "</div>";
    return html;
  }

  function modeText(item) {
    var modeKey = item.mode_key || "";
    if (window.ModeCatalog && typeof window.ModeCatalog.getMode === "function" && modeKey) {
      var mode = window.ModeCatalog.getMode(modeKey);
      if (mode && mode.label) return mode.label;
    }
    return modeKey || item.mode || "未知";
  }

  function formatDuration(ms) {
    var value = Number(ms);
    if (!Number.isFinite(value) || value < 0) value = 0;
    var totalSec = Math.floor(value / 1000);
    var h = Math.floor(totalSec / 3600);
    var m = Math.floor((totalSec % 3600) / 60);
    var s = totalSec % 60;
    if (h > 0) return h + "h " + m + "m " + s + "s";
    if (m > 0) return m + "m " + s + "s";
    return s + "s";
  }

  function buildSummary(result) {
    var summary = el("history-summary");
    if (!summary) return;
    var total = result && Number.isFinite(result.total) ? result.total : 0;
    summary.textContent = "共 " + total + " 条记录" +
      " · 当前第 " + state.page + " 页" +
      " · 每页 " + state.pageSize + " 条";
  }

  function downloadSingleRecord(item) {
    if (!window.LocalHistoryStore) return;
    var payload = window.LocalHistoryStore.exportRecords([item.id]);
    var safeMode = (item.mode_key || "mode").replace(/[^a-zA-Z0-9_-]/g, "_");
    var file = "history_" + safeMode + "_" + item.id + ".json";
    window.LocalHistoryStore.download(file, payload);
  }

  function renderHistory(result) {
    var list = el("history-list");
    if (!list) return;
    list.innerHTML = "";

    var items = result && Array.isArray(result.items) ? result.items : [];
    if (!items.length) {
      list.innerHTML = "<div class='history-item'>暂无历史记录。你可以开始一局游戏后再回来查看。</div>";
      return;
    }

    for (var i = 0; i < items.length; i++) {
      (function () {
        var item = items[i];
        var node = document.createElement("div");
        node.className = "history-item";

        var endedText = item.ended_at ? new Date(item.ended_at).toLocaleString() : "-";
        var best = Number.isFinite(item.best_tile) ? item.best_tile : 0;
        var score = Number.isFinite(item.score) ? item.score : 0;
        var duration = formatDuration(item.duration_ms);

        node.innerHTML =
          "<div class='history-item-head'>" +
            "<strong>" + modeText(item) + "</strong>" +
            "<span>分数: " + score + "</span>" +
            "<span>最大块: " + best + "</span>" +
            "<span>时长: " + duration + "</span>" +
            "<span>结束: " + endedText + "</span>" +
          "</div>" +
          "<div class='history-item-actions'>" +
            "<button class='replay-button history-replay-btn'>回放</button>" +
            "<button class='replay-button history-export-btn'>导出</button>" +
            "<button class='replay-button history-delete-btn'>删除</button>" +
          "</div>" +
          boardToHtml(item.final_board, item.board_width, item.board_height);

        var replayBtn = node.querySelector(".history-replay-btn");
        if (replayBtn) {
          replayBtn.addEventListener("click", function () {
            window.location.href = "replay.html?local_history_id=" + encodeURIComponent(item.id);
          });
        }

        var exportBtn = node.querySelector(".history-export-btn");
        if (exportBtn) {
          exportBtn.addEventListener("click", function () {
            downloadSingleRecord(item);
          });
        }

        var deleteBtn = node.querySelector(".history-delete-btn");
        if (deleteBtn) {
          deleteBtn.addEventListener("click", function () {
            if (!window.confirm("确认删除这条历史记录？此操作不可撤销。")) return;
            var ok = window.LocalHistoryStore.deleteById(item.id);
            if (!ok) {
              setStatus("删除失败：记录不存在或已被删除", true);
              return;
            }
            setStatus("记录已删除", false);
            loadHistory();
          });
        }

        list.appendChild(node);
      })();
    }
  }

  function readFilters() {
    state.modeKey = (el("history-mode").value || "").trim();
    state.keyword = (el("history-keyword").value || "").trim();
    state.sortBy = (el("history-sort").value || "ended_desc").trim();
  }

  function loadHistory(resetPage) {
    if (!window.LocalHistoryStore) return;
    if (resetPage) state.page = 1;
    readFilters();

    var result = window.LocalHistoryStore.listRecords({
      mode_key: state.modeKey,
      keyword: state.keyword,
      sort_by: state.sortBy,
      page: state.page,
      page_size: state.pageSize
    });

    renderHistory(result);
    buildSummary(result);
    setStatus("", false);

    var prevBtn = el("history-prev-page");
    var nextBtn = el("history-next-page");
    if (prevBtn) prevBtn.disabled = state.page <= 1;
    if (nextBtn) {
      var maxPage = Math.max(1, Math.ceil((result.total || 0) / state.pageSize));
      nextBtn.disabled = state.page >= maxPage;
    }
  }

  function initModeFilter() {
    var select = el("history-mode");
    if (!select) return;
    if (!(window.ModeCatalog && typeof window.ModeCatalog.listModes === "function")) return;

    var modes = window.ModeCatalog.listModes();
    for (var i = 0; i < modes.length; i++) {
      var option = document.createElement("option");
      option.value = modes[i].key;
      option.textContent = modes[i].label;
      select.appendChild(option);
    }
  }

  function bindToolbarActions() {
    var reloadBtn = el("history-load-btn");
    if (reloadBtn) {
      reloadBtn.addEventListener("click", function () {
        loadHistory(true);
      });
    }

    var exportAllBtn = el("history-export-all-btn");
    if (exportAllBtn) {
      exportAllBtn.addEventListener("click", function () {
        if (!window.LocalHistoryStore) return;
        var payload = window.LocalHistoryStore.exportRecords();
        var dateTag = new Date().toISOString().slice(0, 10);
        window.LocalHistoryStore.download("2048_local_history_" + dateTag + ".json", payload);
        setStatus("已导出全部历史记录", false);
      });
    }

    var clearAllBtn = el("history-clear-all-btn");
    if (clearAllBtn) {
      clearAllBtn.addEventListener("click", function () {
        if (!window.confirm("确认清空全部本地历史记录？此操作不可撤销。")) return;
        window.LocalHistoryStore.clearAll();
        setStatus("已清空全部历史记录", false);
        loadHistory(true);
      });
    }

    var importBtn = el("history-import-btn");
    var importReplaceBtn = el("history-import-replace-btn");
    var importInput = el("history-import-file");
    if (importBtn && importInput) {
      var importMode = "merge";
      importBtn.addEventListener("click", function () {
        importMode = "merge";
        importInput.click();
      });
      if (importReplaceBtn) {
        importReplaceBtn.addEventListener("click", function () {
          if (!window.confirm("导入并替换会清空当前本地历史后再导入，是否继续？")) return;
          importMode = "replace";
          importInput.click();
        });
      }
      importInput.addEventListener("change", function () {
        var file = importInput.files && importInput.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function () {
          try {
            var merge = importMode !== "replace";
            var result = window.LocalHistoryStore.importRecords(String(reader.result || ""), { merge: merge });
            setStatus("导入成功：新增 " + result.imported + " 条，覆盖 " + result.replaced + " 条。", false);
            loadHistory(true);
          } catch (error) {
            setStatus("导入失败: " + (error && error.message ? error.message : "unknown"), true);
          }
        };
        reader.onerror = function () {
          setStatus("读取文件失败", true);
        };
        reader.readAsText(file, "utf-8");
        importInput.value = "";
      });
    }

    var prevBtn = el("history-prev-page");
    if (prevBtn) {
      prevBtn.addEventListener("click", function () {
        if (state.page <= 1) return;
        state.page -= 1;
        loadHistory(false);
      });
    }

    var nextBtn = el("history-next-page");
    if (nextBtn) {
      nextBtn.addEventListener("click", function () {
        state.page += 1;
        loadHistory(false);
      });
    }

    var mode = el("history-mode");
    if (mode) {
      mode.addEventListener("change", function () {
        loadHistory(true);
      });
    }

    var sort = el("history-sort");
    if (sort) {
      sort.addEventListener("change", function () {
        loadHistory(true);
      });
    }

    var keyword = el("history-keyword");
    if (keyword) {
      keyword.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
          event.preventDefault();
          loadHistory(true);
        }
      });
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    if (!window.LocalHistoryStore) {
      setStatus("本地历史模块未加载", true);
      return;
    }

    initModeFilter();
    bindToolbarActions();
    loadHistory(true);
  });
})();
