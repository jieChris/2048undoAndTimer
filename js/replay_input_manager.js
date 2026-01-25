function ReplayInputManager() {
  this.events = {};
  this.listen();
}

ReplayInputManager.prototype.on = function (event, callback) {
  if (!this.events[event]) {
    this.events[event] = [];
  }
  this.events[event].push(callback);
};

ReplayInputManager.prototype.emit = function (event, data) {
  var callbacks = this.events[event];
  if (callbacks) {
    callbacks.forEach(function (callback) {
      callback(data);
    });
  }
};

ReplayInputManager.prototype.listen = function () {
  // Replay mode doesn't need keyboard input for moves
  // But we could add spacebar for pause if needed later
};
