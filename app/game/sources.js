// ../pub-game-store/native/game/sources.js
// reconstructed from the esbuild bundle in eboot.bin

import { t } from '../i18n/core.js';
import { sourceKind, webURL } from '../state/download-sources.js';
import { isPs5Package } from '../state/firmware.js';
import { isPatchOnly } from '../state/release-sets.js';
import { formatBytes } from '../state/size.js';

  // The format a source carries, shown before downloading ("FFPFSC", "EXFAT", "PKG", "ZIP"...).
  // Formats are technical identifiers, identical in every language; only the unknown case
  // is translated. archive-set is a multi-part bundle, not a file extension.
  function formatLabel(format) {
    if (!format || format === "binary") return t("sources.format.unknown");
    if (format === "archive-set") return t("sources.kind.archive");
    return format.toUpperCase();
  }
  // The extensions a console recognizes, the ones the download engine routes on
  // (ps5-react/runtime/js/download-formats.js).
  var FMT = /^(?:ffpfsc|ffpfs|ffpkg|exfat|pkg|fpkg|lz4|zip|rar|7z|tar|tgz)$/i;
  // The format the host's own link names: the last path segment ending in one of them, reading
  // right to left so "…/file.part01.rar/file" yields "rar" and a bare "file" is skipped.
  function pathFormat(value) {
    if (!value) return null;
    let path;
    try {
      path = webURL(value).path;
    } catch {
      return null;
    }
    const segments = path.split("/").filter(Boolean);
    for (let index = segments.length - 1; index >= 0; index--) {
      let name = segments[index];
      try {
        name = decodeURIComponent(name);
      } catch {
      }
      const found = /\.([a-z0-9]{1,10})$/i.exec(name)?.[1];
      if (found && FMT.test(found)) return found.toLowerCase();
    }
    return null;
  }
  // The edition's label when it says the format outright. Only tokens no game title can carry
  // (exFAT, ffpfs, ffpkg) or a dotted extension: a bare "zip" inside a name would be a guess.
  function labelFormat(label) {
    const text = String(label || "");
    const exotic = /\b(ffpfs|ffpkg|exfat|lz4)\b/i.exec(text);
    if (exotic) return exotic[1].toLowerCase();
    return /\.(zip|rar|7z|pkg|tar|tgz)\b/i.exec(text)?.[1]?.toLowerCase() ?? null;
  }
  // What the catalog could not name, the link and the label still can. Display only: the queue
  // keeps detecting the real kind from the bytes it receives (download-formats.js detectedArtifact).
  function inferFormat(release) {
    if (!release) return null;
    if (release.format && release.format !== "binary") return release.format;
    return pathFormat(release.browserUrl) || pathFormat(release.url) || labelFormat(release.label) || release.format || null;
  }
  // What the console does with the file, beside its technical name ("RAR · Extract").
  var ACTION = {
    pkg: "sources.action.install",
    fpkg: "sources.action.install",
    zip: "sources.action.extract",
    rar: "sources.action.extract",
    "7z": "sources.action.extract",
    tar: "sources.action.extract",
    tgz: "sources.action.extract",
    "archive-set": "sources.action.extract",
    exfat: "sources.action.image",
    ffpfs: "sources.action.image",
    ffpfsc: "sources.action.image",
    ffpkg: "sources.action.image",
    lz4: "sources.action.image"
  };
  function formatAction(format) {
    const key = format && ACTION[String(format).toLowerCase()];
    return key ? t(key) : "";
  }
  // For the panels with room beside the value (game details, the edition picker, a source row):
  // the code and what happens to it. A format nobody declared stays short — there is no action
  // to promise yet.
  function formatDetail(format) {
    const action = formatAction(format);
    if (!action) return t("sources.format.unknown");
    return [formatLabel(format), action].join(" \xB7 ");
  }
  function edition({ label, provider }) {
    const text = (label || "").replace(/\s*·\s*\d+ parts$/, "").trim();
    const split = text.lastIndexOf(" - ");
    const host2 = provider.toLowerCase().replace(/^www\./, "").slice(0, 4);
    const edition2 = split >= 0 && text.slice(split + 3).toLowerCase().startsWith(host2) ? text.slice(0, split) : text;
    return provider.toLowerCase().startsWith(edition2.toLowerCase()) ? "" : edition2;
  }
  var GATED = /* @__PURE__ */ new Set(["vikingfile", "buzzheavier"]);
  function access(release) {
    const first = release.parts?.[0]?.sources[0] ?? release;
    let kind;
    try {
      kind = sourceKind(first);
    } catch {
      return "browser";
    }
    if (kind === "direct" || kind === "manifest") return "direct";
    return kind === "browser" || kind === "datanodes" || kind === "unavailable" || GATED.has(kind) ? "browser" : "page";
  }
  // The firmware a source needs, from its label ("USA 10.xx Base", "10.xx BackPort 4.xx"): a backport
  // runs from the lowest firmware it names, anything else needs the highest. Null when it names none.
  function requiredFirmware(release) {
    const named = [...(release.label || "").matchAll(/\b(\d{1,2})\.xx\b/gi)].map((match) => Number(match[1]));
    if (!named.length) return null;
    return isBackport(release) ? Math.min(...named) : Math.max(...named);
  }
  // A line under the source for what it is beyond a game image (issue #13). Nothing reads the
  // console's firmware here: the jailbreak can raise what the title is told (13.59 on a 13.20
  // console), so a "works on your firmware" verdict could be wrong either way. The firmware a source
  // needs is shown where the player checks it themselves (game details, the download tips).
  function compatibility(release) {
    if (isPatchOnly(release)) return { tone: "warn", text: t("sources.status.patch") };
    // A PS5 PKG's firmware limit outweighs its being a DLC: the source list has room for one line.
    if (isPs5Package(release)) return { tone: "warn", text: t("sources.status.package") };
    if (isDlc(release)) return { tone: "info", text: t("sources.status.dlc") };
    return null;
  }
  var SPEED = { "archive.org": "sources.speed.archive", mediafire: "sources.speed.mediafire", "padrino cdn": "sources.cdnFastest" };
  var isOverdriveCdn = (provider) => /^(?:overdrive|padrino)\s*cdn$/i.test(provider ?? "");
  function describeSource(release) {
    const parts = release.parts?.length;
    const detail2 = [
      edition(release),
      release.version ? `v${release.version.replace(/^v/i, "")}` : null,
      isPatchOnly(release) ? t("sources.kind.patch") : formatDetail(inferFormat(release)),
      parts ? t("sources.parts", { count: parts }) : null
    ].filter(Boolean).join(" \xB7 ");
    const reach = access(release);
    const speed = SPEED[release.provider.toLowerCase()];
    return {
      name: release.provider.replace(/^www\./, ""),
      detail: speed ? [detail2, t(speed)].filter(Boolean).join(" \xB7 ") : detail2,
      size: release.sizeBytes ? formatBytes(release.sizeBytes) : null,
      group: release.unavailableReason ? "unavailable" : reach,
      reason: release.unavailableReason ?? null,
      status: release.unavailableReason ? null : compatibility(release)
    };
  }
  var isDlc = ({ label }) => /\bDLCs?\b/i.test(label || "") && !/\b(?:game|full)\b|\+\s*(?:all\s+)?DLCs?\b|\bwith\s+(?:all\s+)?DLCs?\b|\bincl/i.test(label);
  var GROUP_RANK = { direct: 0, page: 1, browser: 2, unavailable: 3 };
  var HEALTH_RANK = { ok: 0, flaky: 2 };
  var isBackport = ({ label }) => /\bback\s*port\b/i.test(label || "");
  // After the direct hosts, the browser hosts confirmed on the console (Vikingfile, DataNodes, FileKeeper),
  // then MediaFire: its files are often removed (most of the PS4 ones taken from DLPSGAME in October 2026)
  // and it answers a busy address with HTTP 429. Then the hosts still being tried (AkiraBox, a vault's
  // other mirrors).
  var CONFIRMED = /^(?:vik[i1]ngfile|datanodes|filekeeper(?:\.net)?)$/i;
  var hostRank = ({ provider }) => isOverdriveCdn(provider) ? 0 : provider.toLowerCase() === "archive.org" ? 1 : CONFIRMED.test(provider) ? 2 : provider.toLowerCase() === "mediafire" ? 3 : 4;
  var ranked = (release, index) => ({ release, index, rank: [
    isDlc(release) ? 1 : 0,
    release.unavailableReason ? 1 : 0,
    isPatchOnly(release) ? 1 : 0,
    isPs5Package(release) ? 1 : 0,
    // A backport is the game fixed for older firmware, or only the files to copy over it (a 40 MB
    // download, issue #47): the full game comes first whatever its host.
    isBackport(release) ? 1 : 0,
    hostRank(release),
    GROUP_RANK[describeSource(release).group],
    HEALTH_RANK[release.health] ?? 1,
    release.source === "orbit" ? 0 : 1,
    release.requiresBrowser ? 1 : 0
  ] });
  var compare = (a, b) => a.rank.reduce((order, value, i) => order || value - b.rank[i], 0) || a.index - b.index;
  function preferredRelease(releases) {
    return releases.map(ranked).sort(compare)[0]?.index ?? 0;
  }
  function sourceSections(releases) {
    const sections = ["direct", "page", "browser", "dlc", "unavailable"].map((group) => ({ group, items: [] }));
    releases.forEach((release, index) => {
      const { group } = describeSource(release);
      const into = group !== "unavailable" && isDlc(release) ? "dlc" : group;
      sections.find((section) => section.group === into).items.push({ release, index });
    });
    const links = ({ release }) => release.parts?.length ?? 1;
    sections[2].items.sort((a, b) => links(a) - links(b));
    return sections.filter((section) => section.items.length);
  }

export { describeSource, formatAction, formatDetail, formatLabel, inferFormat, isDlc, isOverdriveCdn, preferredRelease, requiredFirmware, sourceSections };
