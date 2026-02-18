(function () {
  var STORAGE = {
    apiBase: "api_base_url_v1",
    accessToken: "auth_access_token_v1",
    refreshToken: "auth_refresh_token_v1",
    user: "auth_user_v1",
    pendingSessions: "pending_sessions_v1"
  };

  function readJson(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch (_err) {
      return fallback;
    }
  }

  function writeJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function getApiBase() {
    return localStorage.getItem(STORAGE.apiBase) || window.API_BASE_URL || "/api/v1";
  }

  function getApiOrigin() {
    return getApiBase().replace(/\/api\/v1\/?$/i, "");
  }

  function setApiBase(url) {
    if (typeof url === "string" && url.trim()) {
      localStorage.setItem(STORAGE.apiBase, url.trim().replace(/\/$/, ""));
    }
  }

  function getAccessToken() {
    return localStorage.getItem(STORAGE.accessToken) || "";
  }

  function getRefreshToken() {
    return localStorage.getItem(STORAGE.refreshToken) || "";
  }

  function getCurrentUser() {
    return readJson(STORAGE.user, null);
  }

  function setAuthState(payload) {
    if (payload && payload.access_token) {
      localStorage.setItem(STORAGE.accessToken, payload.access_token);
    }
    if (payload && payload.refresh_token) {
      localStorage.setItem(STORAGE.refreshToken, payload.refresh_token);
    }
    if (payload && payload.user) {
      writeJson(STORAGE.user, payload.user);
    }
    window.dispatchEvent(new CustomEvent("authchange", { detail: { user: getCurrentUser() } }));
  }

  function clearAuthState() {
    localStorage.removeItem(STORAGE.accessToken);
    localStorage.removeItem(STORAGE.refreshToken);
    localStorage.removeItem(STORAGE.user);
    window.dispatchEvent(new CustomEvent("authchange", { detail: { user: null } }));
  }

  async function rawRequest(method, path, body, options) {
    options = options || {};
    var headers = {
      "Content-Type": "application/json"
    };

    var token = getAccessToken();
    if (options.auth && token) {
      headers.Authorization = "Bearer " + token;
    }

    var response;
    try {
      response = await fetch(getApiBase() + path, {
        method: method,
        headers: headers,
        body: body ? JSON.stringify(body) : undefined
      });
    } catch (networkError) {
      var offlineErr = new Error("network_error");
      offlineErr.code = "NETWORK_ERROR";
      throw offlineErr;
    }

    var data = null;
    var rawText = "";
    if (response.status !== 204) {
      try {
        rawText = await response.text();
      } catch (_err) {
        rawText = "";
      }
      if (rawText) {
        try {
          data = JSON.parse(rawText);
        } catch (_err2) {
          data = null;
        }
      }
    }

    if (!response.ok) {
      var message = "request_failed";
      if (data && data.error) message = data.error;
      else if (data && data.message) message = data.message;
      else if (rawText) message = "http_" + response.status + "_non_json_response";
      else message = "http_" + response.status;

      var err = new Error(message);
      err.status = response.status;
      err.payload = data;
      err.rawText = rawText;
      throw err;
    }

    return data;
  }

  async function refreshAccessToken() {
    var refreshToken = getRefreshToken();
    if (!refreshToken) {
      var err = new Error("missing_refresh_token");
      err.code = "NO_REFRESH_TOKEN";
      throw err;
    }

    var data = await rawRequest("POST", "/auth/refresh", {
      refresh_token: refreshToken
    }, { auth: false });

    setAuthState(data);
    return data;
  }

  async function request(method, path, body, options) {
    options = options || {};
    if (options.auth && !getAccessToken()) {
      var authErr = new Error("auth_required");
      authErr.code = "AUTH_REQUIRED";
      throw authErr;
    }

    try {
      return await rawRequest(method, path, body, options);
    } catch (error) {
      var shouldRefresh = options.auth && error && error.status === 401 && !options._retried;
      if (!shouldRefresh) {
        throw error;
      }

      await refreshAccessToken();
      return request(method, path, body, {
        auth: options.auth,
        _retried: true
      });
    }
  }

  function getPendingSessions() {
    var queue = readJson(STORAGE.pendingSessions, []);
    if (!Array.isArray(queue)) return [];
    return queue;
  }

  function savePendingSessions(queue) {
    writeJson(STORAGE.pendingSessions, queue);
  }

  function queueSession(payload, reason) {
    var queue = getPendingSessions();
    queue.push({
      payload: payload,
      reason: reason || "pending",
      queued_at: new Date().toISOString()
    });
    savePendingSessions(queue);
  }

  async function flushPendingSessions() {
    var queue = getPendingSessions();
    if (!queue.length || !getAccessToken()) {
      return { uploaded: 0, remaining: queue.length };
    }

    var uploaded = 0;
    var remaining = [];

    for (var i = 0; i < queue.length; i++) {
      var item = queue[i];
      try {
        await request("POST", "/sessions/complete", item.payload, { auth: true });
        uploaded += 1;
      } catch (error) {
        if (error && (error.code === "NETWORK_ERROR" || error.status >= 500 || error.status === 401)) {
          remaining.push(item);
          for (var j = i + 1; j < queue.length; j++) {
            remaining.push(queue[j]);
          }
          break;
        }
      }
    }

    savePendingSessions(remaining);
    return { uploaded: uploaded, remaining: remaining.length };
  }

  async function register(username, password) {
    var data = await request("POST", "/auth/register", { username: username, password: password });
    setAuthState(data);
    await flushPendingSessions();
    return data;
  }

  async function login(username, password) {
    var data = await request("POST", "/auth/login", { username: username, password: password });
    setAuthState(data);
    await flushPendingSessions();
    return data;
  }

  async function logout() {
    try {
      var refreshToken = getRefreshToken();
      if (refreshToken) {
        await request("POST", "/auth/logout", { refresh_token: refreshToken });
      }
    } catch (_err) {
      // ignore logout API failure
    }
    clearAuthState();
  }

  async function fetchMe() {
    var data = await request("GET", "/auth/me", null, { auth: true });
    setAuthState(data);
    return data;
  }

  async function completeSession(payload) {
    try {
      var data = await request("POST", "/sessions/complete", payload, { auth: true });
      return { queued: false, data: data };
    } catch (error) {
      if (error.code === "AUTH_REQUIRED" || error.code === "NETWORK_ERROR" || error.status === 401 || error.status >= 500) {
        queueSession(payload, error.message);
        return { queued: true };
      }
      throw error;
    }
  }

  async function getLeaderboard(bucket, period, limit, offset) {
    var p = period || "all";
    var l = typeof limit === "number" ? limit : 50;
    var o = typeof offset === "number" ? offset : 0;
    return request("GET", "/leaderboards/" + encodeURIComponent(bucket) + "?period=" + encodeURIComponent(p) + "&limit=" + l + "&offset=" + o);
  }

  async function getUserHistory(username, options) {
    options = options || {};
    var query = [];
    if (options.mode_key) query.push("mode_key=" + encodeURIComponent(options.mode_key));
    else if (options.mode) query.push("mode=" + encodeURIComponent(options.mode));
    if (options.page) query.push("page=" + encodeURIComponent(options.page));
    if (options.page_size) query.push("page_size=" + encodeURIComponent(options.page_size));
    var qs = query.length ? "?" + query.join("&") : "";
    return request("GET", "/users/" + encodeURIComponent(username) + "/history" + qs);
  }

  async function getSession(sessionId) {
    return request("GET", "/sessions/" + encodeURIComponent(sessionId));
  }

  async function getDailyChallenge() {
    return request("GET", "/challenges/daily");
  }

  async function getChallengeLeaderboard(challengeId, limit, offset) {
    var l = typeof limit === "number" ? limit : 50;
    var o = typeof offset === "number" ? offset : 0;
    return request("GET", "/challenges/" + encodeURIComponent(challengeId) + "/leaderboard?limit=" + l + "&offset=" + o);
  }

  async function healthcheck() {
    var response;
    var rawText = "";
    var data = null;
    try {
      response = await fetch(getApiOrigin() + "/healthz", {
        method: "GET"
      });
    } catch (_err) {
      var networkErr = new Error("network_error");
      networkErr.code = "NETWORK_ERROR";
      throw networkErr;
    }

    try {
      rawText = await response.text();
    } catch (_err2) {
      rawText = "";
    }

    if (rawText) {
      try {
        data = JSON.parse(rawText);
      } catch (_err3) {
        data = null;
      }
    }

    if (!response.ok) {
      var msg = (data && (data.error || data.message)) || ("http_" + response.status);
      var err = new Error(msg);
      err.status = response.status;
      err.payload = data;
      err.rawText = rawText;
      throw err;
    }

    return data || { ok: true };
  }

  window.ApiClient = {
    setApiBase: setApiBase,
    getApiBase: getApiBase,
    getApiOrigin: getApiOrigin,
    healthcheck: healthcheck,
    register: register,
    login: login,
    logout: logout,
    fetchMe: fetchMe,
    completeSession: completeSession,
    getLeaderboard: getLeaderboard,
    getDailyChallenge: getDailyChallenge,
    getChallengeLeaderboard: getChallengeLeaderboard,
    getUserHistory: getUserHistory,
    getSession: getSession,
    getCurrentUser: getCurrentUser,
    getPendingSessions: getPendingSessions,
    flushPendingSessions: flushPendingSessions
  };
})();
