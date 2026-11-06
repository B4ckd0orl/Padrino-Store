import { loadList, saveList } from './saved.js';

  // The drive the Files screen last looked at, kept between sessions: with three drives plugged the
  // tab always opened on the first one, and the player picked the right one again every time. It
  // lives in settings.json beside the drive downloads are saved to. A drive that is gone (or no
  // choice at all) falls back to the first one, so a disconnected drive never selects itself.
  var SETTINGS = "settings.json";
  var saved = loadList(SETTINGS, "settings")["last-drive"];
  var current = typeof saved === "string" ? saved : null;
  var lastDrive = () => current;
  function setLastDrive(root) {
    const next = typeof root === "string" ? root : null;
    if (next === current) return;
    current = next;
    const { "last-drive": _old, ...settings } = loadList(SETTINGS, "settings");
    saveList(SETTINGS, "settings", next ? { ...settings, "last-drive": next } : settings);
  }
  // The tab's own drive: the remembered one while it is still plugged in, else the first drive there
  // is (roots is never empty when the screen opens).
  function driveIndex(roots, remembered) {
    const index = remembered ? roots.indexOf(remembered) : -1;
    return index >= 0 ? index : 0;
  }

export { driveIndex, lastDrive, setLastDrive };
