// ../pub-game-store/native/state/install-location.js
// reconstructed from the esbuild bundle in eboot.bin
// MODIFIED: the fallback finds the image under its released name, PadrinoStore.exfat, too.
// MODIFIED: no install found returns null (payload runs have no install to replace); the
// double-install case still throws, as before.


  var SHADOWMOUNT = "http://127.0.0.1:10101/api/v1/games/info";
  var STORAGE_ROOT = /^(\/data|\/mnt\/(?:usb|ext)\d+)\//;
  async function locateInstall({ http, fs, roots, title }) {
    const found = await registeredInstall({ http, title });
    const install = found ? fromShadowMount(found) : inHomebrew({ fs, roots, title });
    if (!install) return null;
    if (install.installDir && !fs.exists(`${install.installDir}/eboot.bin`)) throw new Error(`Padrino Store's install folder ${install.installDir} has no eboot.bin`);
    if (install.image && !fs.exists(install.image)) throw new Error(`Padrino Store's image ${install.image} is missing`);
    const path = install.installDir ?? install.image;
    const root2 = STORAGE_ROOT.exec(path)?.[1] ?? path.replace(/\/[^/]+\/[^/]+$/, "");
    return { ...install, workDir: `${root2}/padrino-update` };
  }
  async function registeredInstall({ http, title }) {
    try {
      const response = await http.request(SHADOWMOUNT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title_id: title }),
        maxBytes: 64 * 1024
      });
      if (!response.ok) return null;
      const info = await response.json();
      return info?.path ? { path: info.path, type: info.source_type } : null;
    } catch {
      return null;
    }
  }
  function fromShadowMount({ path, type }) {
    if (type === "folder") return { installDir: path };
    if (type === "image" && path.endsWith(".exfat")) return { image: path };
    throw new Error(`ShadowMount runs Padrino Store from ${path}, an install of type ${type}`);
  }
  // PadrinoStore.exfat as released, or PadrinoStore-PPSA99059….exfat from before the rename.
  var imagesIn = ({ fs, dir: dir2, title }) => fs.exists(dir2) ? fs.readDir(dir2).filter((entry2) => !entry2.isDirectory && new RegExp(`^PadrinoStore(?:-${title})?\\b.*\\.exfat$`, "i").test(entry2.name)).map((entry2) => ({ image: `${dir2}/${entry2.name}` })) : [];
  function inHomebrew({ fs, roots, title }) {
    const found = roots().flatMap((root2) => [
      ...fs.exists(`${root2}/homebrew/${title}/eboot.bin`) ? [{ installDir: `${root2}/homebrew/${title}` }] : [],
      ...imagesIn({ fs, dir: `${root2}/homebrew`, title })
    ]);
    if (found.length !== 1) {
      if (!found.length) return null;
      throw new Error(`Padrino Store is installed twice: ${found.map((item) => item.installDir ?? item.image).join(" and ")}`);
    }
    return found[0];
  }

export { locateInstall };
