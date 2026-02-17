(function () {
  function el(id) {
    return document.getElementById(id);
  }

  function setStatus(text, isError) {
    var status = el("leaderboard-status");
    if (!status) return;
    status.textContent = text || "";
    status.style.color = isError ? "#c0392b" : "#4a4a4a";
  }

  function formatDuration(ms) {
    var seconds = Math.floor(ms / 1000);
    var mins = Math.floor(seconds / 60);
    var secs = seconds % 60;
    return mins + "m " + secs + "s";
  }

  function renderRows(items) {
    var tbody = el("leaderboard-body");
    if (!tbody) return;
    tbody.innerHTML = "";

    if (!items.length) {
      var empty = document.createElement("tr");
      empty.innerHTML = "<td colspan='7'>暂无数据</td>";
      tbody.appendChild(empty);
      return;
    }

    for (var i = 0; i < items.length; i++) {
      var row = document.createElement("tr");
      var item = items[i];
      row.innerHTML =
        "<td>" + item.rank + "</td>" +
        "<td><a href='history.html?username=" + encodeURIComponent(item.username) + "'>" + item.username + "</a></td>" +
        "<td>" + item.score + "</td>" +
        "<td>" + item.best_tile + "</td>" +
        "<td>" + formatDuration(item.duration_ms) + "</td>" +
        "<td>" + new Date(item.ended_at).toLocaleString() + "</td>" +
        "<td><a href='replay.html?session_id=" + encodeURIComponent(item.session_id) + "'>回放</a></td>";
      tbody.appendChild(row);
    }
  }

  async function loadLeaderboard() {
    var bucket = el("leaderboard-mode").value;
    var period = el("leaderboard-period").value;

    try {
      setStatus("加载中...", false);
      var data = await window.ApiClient.getLeaderboard(bucket, period, 50, 0);
      renderRows(data.items || []);
      setStatus("", false);
    } catch (error) {
      setStatus("加载失败: " + (error.message || "unknown"), true);
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    if (!window.ApiClient) return;
    el("leaderboard-refresh-btn").addEventListener("click", loadLeaderboard);
    el("leaderboard-mode").addEventListener("change", loadLeaderboard);
    el("leaderboard-period").addEventListener("change", loadLeaderboard);
    loadLeaderboard();
  });
})();
