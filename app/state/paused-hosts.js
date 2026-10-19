// ../pub-game-store/native/state/paused-hosts.js
// reconstructed from the esbuild bundle in eboot.bin

import { sourceKind, webURL } from './download-sources.js';
import { vikingLinkPage } from './viking-capture.js';

  // The browser-gated hosts the store stops offering: each needs a page opened and a check passed
  // before its link resolves, so a game whose only sources sit on them is not worth listing.
  var PAUSE_BROWSER_HOSTS = true;
  // Mirrors behind link-vault.org name the host they stand for after the "#" in the page URL.
  var TESTING = ["datanodes.to", "datanodes.co", "akirabox.com", "akirabox.to"];
  var TESTING_MIRRORS = ["DataNodes", "FileKeeper", "Filek", "AkiraBox"];
  function testing(release) {
    try {
      const url = release.browserUrl || release.url;
      const host2 = webURL(url).host.replace(/^www\./, "");
      if (host2 === "link-vault.org") return TESTING_MIRRORS.includes(url.split("#")[1] || (release.label || "").split(" - ").pop());
      return TESTING.some((domain) => host2 === domain || host2.endsWith(`.${domain}`));
    } catch {
      return false;
    }
  }
  var PAUSED_FILTERS = /* @__PURE__ */ new Set([
    "1fichier",
    "datavaults",
    "buzzheavier",
    "gofile",
    "rapidgator",
    "filecrypt",
    "ranoz",
    "transfer",
    "mega",
    "urlvanish",
    "fileditchfiles",
    "tinyurl",
    "fuckingfast",
    "rootz.so",
    "1024terabox"
  ]);
  // A release is paused when it can only be had through a gated host, except the ones the app
  // downloads by itself (vikingfile, archive.org) and the test mirrors it still resolves.
  function pausedSource(release) {
    if (!PAUSE_BROWSER_HOSTS) return false;
    let kind;
    try {
      kind = sourceKind(release);
    } catch {
      return false;
    }
    if (kind === "vikingfile" || vikingLinkPage(release) || /archive\.org$/i.test(release.provider || "") || testing(release)) return false;
    return kind === "browser" || kind === "datanodes" || kind === "buzzheavier";
  }
  var pausedFilter = (host2) => PAUSE_BROWSER_HOSTS && PAUSED_FILTERS.has(host2);

export { PAUSED_FILTERS, PAUSE_BROWSER_HOSTS, pausedFilter, pausedSource };
