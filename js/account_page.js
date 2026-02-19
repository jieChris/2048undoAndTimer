(function () {
  function el(id) {
    return document.getElementById(id);
  }

  function setStatus(text, isError) {
    var status = el("account-status");
    if (!status) return;
    status.textContent = text || "";
    status.style.color = isError ? "#c0392b" : "#4a4a4a";
  }

  function renderUser() {
    var user = window.ApiClient.getCurrentUser();
    var panel = el("account-user-panel");
    if (!panel) return;

    if (!user) {
      panel.innerHTML = "<strong>当前未登录</strong>";
      return;
    }

    panel.innerHTML =
      "<strong>已登录：</strong>" + user.username +
      " <a href='history.html?username=" + encodeURIComponent(user.username) + "'>查看我的历史</a>";
  }

  async function refreshPendingQueueInfo() {
    var q = window.ApiClient.getPendingSessions();
    var queueInfo = el("account-queue-info");
    if (queueInfo) {
      queueInfo.textContent = "待补传对局：" + q.length;
    }

    var lastEl = el("account-last-submit");
    if (lastEl) {
      try {
        var raw = localStorage.getItem("last_session_submit_result_v1");
        if (!raw) {
          lastEl.textContent = "最近自动上传：暂无记录";
          return;
        }
        var info = JSON.parse(raw);
        if (!info || typeof info !== "object") {
          lastEl.textContent = "最近自动上传：暂无记录";
          return;
        }
        if (info.ok) {
          lastEl.textContent = "最近自动上传：成功（模式 " + (info.mode || "-") + "，分数 " + (info.score || 0) + (info.queued ? "，离线排队" : "") + "）";
        } else if (info.skipped) {
          lastEl.textContent = "最近自动上传：已跳过（" + (info.reason || "unknown") + "）";
        } else {
          lastEl.textContent = "最近自动上传：失败（" + (info.error || info.reason || "unknown") + "）";
        }
      } catch (_err) {
        lastEl.textContent = "最近自动上传：读取失败";
      }
    }
  }

  async function handleRegister(event) {
    event.preventDefault();
    var username = el("reg-username").value.trim();
    var password = el("reg-password").value;

    try {
      await window.ApiClient.register(username, password);
      setStatus("注册成功并已登录", false);
      renderUser();
      refreshPendingQueueInfo();
    } catch (error) {
      setStatus("注册失败: " + (error.message || "unknown"), true);
    }
  }

  async function handleLogin(event) {
    event.preventDefault();
    var username = el("login-username").value.trim();
    var password = el("login-password").value;

    try {
      await window.ApiClient.login(username, password);
      setStatus("登录成功", false);
      renderUser();
      refreshPendingQueueInfo();
    } catch (error) {
      setStatus("登录失败: " + (error.message || "unknown"), true);
    }
  }

  async function handleLogout() {
    await window.ApiClient.logout();
    setStatus("已退出登录", false);
    renderUser();
  }

  async function handleFlushQueue() {
    try {
      var result = await window.ApiClient.flushPendingSessions();
      setStatus("补传完成：成功 " + result.uploaded + "，剩余 " + result.remaining, false);
      refreshPendingQueueInfo();
    } catch (error) {
      setStatus("补传失败: " + (error.message || "unknown"), true);
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    if (!window.ApiClient) return;

    renderUser();
    refreshPendingQueueInfo();

    var regForm = el("register-form");
    if (regForm) regForm.addEventListener("submit", handleRegister);

    var loginForm = el("login-form");
    if (loginForm) loginForm.addEventListener("submit", handleLogin);

    var logoutBtn = el("logout-btn");
    if (logoutBtn) logoutBtn.addEventListener("click", handleLogout);

    var flushBtn = el("flush-queue-btn");
    if (flushBtn) flushBtn.addEventListener("click", handleFlushQueue);

    window.addEventListener("authchange", function () {
      renderUser();
      refreshPendingQueueInfo();
    });
  });
})();
