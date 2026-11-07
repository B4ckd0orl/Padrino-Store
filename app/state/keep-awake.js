// The console has a single stay-awake switch (Power.keepAwake), and more than one part of the app
// holds it for its own duration: a compression job, the download queue, a move of finished files.
// Writing the raw flag from two places lets whichever finishes first put the console to sleep
// under the other -- a download ending in the middle of a pack, a pack ending in the middle of a
// move. Every subsystem therefore states its reason here, and the switch stays on while at least
// one reason is outstanding. The state lives per Power handle, so each caller's own handle keeps
// its own book and a test's fake is a world of its own.

const states = new WeakMap();

function slotFor(power) {
  let slot = states.get(power);
  if (!slot) {
    slot = { reasons: new Set(), on: false };
    states.set(power, slot);
  }
  return slot;
}

// The native flag is written only when the shared verdict actually flips, so a poll that repeats
// what is already true leaves the host alone.
function sync(power, slot) {
  const on = slot.reasons.size > 0;
  if (on === slot.on) return;
  slot.on = on;
  power.keepAwake(on);
}

function ready(power) {
  return !!power && typeof power.keepAwake === "function";
}

// Take the switch for `reason` until it is released. Requesting twice is the same as once.
function requestAwake(reason, power) {
  if (!ready(power)) return;
  const slot = slotFor(power);
  slot.reasons.add(reason);
  sync(power, slot);
}

// Give `reason` back. The switch only goes off when nothing else is holding it.
function releaseAwake(reason, power) {
  if (!ready(power)) return;
  const slot = slotFor(power);
  slot.reasons.delete(reason);
  sync(power, slot);
}

export { releaseAwake, requestAwake };
