// Whose turn it is on the native request thread (ps5-react/native/shared/network.cpp runs one
// request at a time, thirty seconds each): a link resolution the player started holds the turn
// from the moment it begins until it settles, and the store's background fetches give theirs up
// for it — cancelled mid-flight and fired again once the resolution is over — so starting a
// download never queues behind a catalog update or a feed fetch.

  var turns = 0;
  var background = new Set();

  function turnBegin() {
    turns += 1;
    for (const cancel of [...background]) {
      background.delete(cancel);
      cancel();
    }
  }
  function turnEnd() {
    if (turns > 0) turns -= 1;
  }
  function turnBusy() {
    return turns > 0;
  }
  // A background fetch registers its cancel while no resolution holds the turn; false while one
  // does, so the caller fires the fetch again later instead of starting it.
  function backgroundHold(cancel) {
    if (turns > 0) return false;
    background.add(cancel);
    return true;
  }
  function backgroundRelease(cancel) {
    background.delete(cancel);
  }

export { backgroundHold, backgroundRelease, turnBegin, turnBusy, turnEnd };
