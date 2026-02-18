(function () {
  function el(id) {
    return document.getElementById(id);
  }

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

    var style = "grid-template-columns: repeat(" + w + ", 52px); grid-template-rows: repeat(" + h + ", 52px);";
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
    if (modeKey) return modeKey;

    if (item.mode === "classic") return "经典";
    if (item.mode === "capped") return "封顶";
    if (item.mode === "practice") return "练习";
    return item.mode || "未知";
  }

  function renderHistory(username, items) {
    var list = el("history-list");
    if (!list) return;
    var title = el("history-title");
    if (title) title.textContent = username + " 的历史对局";

    list.innerHTML = "";
    if (!items.length) {
      list.innerHTML = "<div class='history-item'>暂无历史数据</div>";
      return;
    }

    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      var node = document.createElement("div");
      node.className = "history-item";

      var dimText = (item.board_width || 4) + "x" + (item.board_height || 4);
      var ruleText = item.ruleset === "fibonacci" ? "Fibonacci" : "2幂";
      var rankedText = item.ranked_bucket && item.ranked_bucket !== "none" ? ("进榜: " + item.ranked_bucket) : "不进榜";
      var specialRules = item.special_rules_snapshot && typeof item.special_rules_snapshot === "object"
        ? JSON.stringify(item.special_rules_snapshot)
        : "{}";
      var challengeText = item.challenge_id ? ("挑战: " + item.challenge_id) : "普通对局";

      node.innerHTML =
        "<div class='history-item-head'>" +
          "<span>模式: " + modeText(item) + "</span>" +
          "<span>棋盘: " + dimText + "</span>" +
          "<span>规则: " + ruleText + "</span>" +
          "<span>撤回: " + (item.undo_enabled ? "开" : "关") + "</span>" +
          "<span>状态: " + item.status + "</span>" +
          "<span>分数: " + item.score + "</span>" +
          "<span>最大块: " + item.best_tile + "</span>" +
          "<span>" + rankedText + "</span>" +
          "<span>" + challengeText + "</span>" +
          "<span>规则参数: " + specialRules + "</span>" +
          "<span>结束: " + new Date(item.ended_at).toLocaleString() + "</span>" +
          "<a href='replay.html?session_id=" + encodeURIComponent(item.session_id) + "'>回放</a>" +
        "</div>" +
        boardToHtml(item.final_board, item.board_width, item.board_height);
      list.appendChild(node);
    }
  }

  function getDefaultUsername() {
    var params = new URLSearchParams(window.location.search);
    var qUser = params.get("username");
    if (qUser) return qUser;
    var user = window.ApiClient.getCurrentUser();
    return user ? user.username : "";
  }

  function initModeFilter() {
    var select = el("history-mode");
    if (!select) return;

    if (!(window.ModeCatalog && typeof window.ModeCatalog.listModes === "function")) {
      return;
    }

    var modes = window.ModeCatalog.listModes();
    for (var i = 0; i < modes.length; i++) {
      var option = document.createElement("option");
      option.value = modes[i].key;
      option.textContent = modes[i].label;
      select.appendChild(option);
    }
  }

  async function loadHistory() {
    var username = el("history-username").value.trim();
    var modeKey = el("history-mode").value;
    if (!username) {
      setStatus("请输入用户名", true);
      return;
    }

    var options = { page: 1, page_size: 20 };
    if (modeKey) options.mode_key = modeKey;

    try {
      setStatus("加载中...", false);
      var data = await window.ApiClient.getUserHistory(username, options);
      renderHistory(data.username, data.items || []);
      setStatus("", false);
    } catch (error) {
      setStatus("加载失败: " + (error.message || "unknown"), true);
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    if (!window.ApiClient) return;

    initModeFilter();

    var userInput = el("history-username");
    userInput.value = getDefaultUsername();

    el("history-load-btn").addEventListener("click", loadHistory);
    el("history-mode").addEventListener("change", loadHistory);

    if (userInput.value) {
      loadHistory();
    }
  });
})();
