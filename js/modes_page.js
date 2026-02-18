(function () {
  function el(id) {
    return document.getElementById(id);
  }

  function bindDailyChallenge() {
    var btn = el("daily-challenge-btn");
    var status = el("daily-challenge-status");
    if (!btn || !window.ApiClient) return;

    btn.addEventListener("click", function (event) {
      event.preventDefault();
      if (status) status.textContent = "加载今日挑战中...";
      window.ApiClient.getDailyChallenge()
        .then(function (challenge) {
          if (!challenge || !challenge.mode_key || !challenge.id) {
            throw new Error("challenge_payload_invalid");
          }
          var url = "play.html?mode_key=" + encodeURIComponent(challenge.mode_key) +
            "&challenge_id=" + encodeURIComponent(challenge.id);
          window.location.href = url;
        })
        .catch(function (error) {
          if (status) {
            status.textContent = "加载挑战失败: " + (error && error.message ? error.message : "unknown");
          }
        });
    });
  }

  document.addEventListener("DOMContentLoaded", bindDailyChallenge);
})();
