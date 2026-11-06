// What packs a folder already holds. The engine writes its own index beside the files it packed,
// and the name of that index says which format: ampr_zstd.index for zstd packs, ampr_assets.index
// for LZ4 packs. The decoder's own index (ampr_emu.index) is not a pack -- it is the runtime, and
// it stays behind after an unpack -- so a folder with only that is still a plain game folder.

  var MARKS = [
    ["zstd", "ampr_zstd.index"],
    ["lz4", "ampr_assets.index"]
  ];
  // The index sits in the folder itself; sce_sys is checked too since a conversion may keep the
  // system files where they were. Either place means the same thing to the runtime.
  function packedFormat(fs, folder) {
    if (!folder) return "";
    for (const [format, name] of MARKS) {
      if (fs.exists(`${folder}/${name}`) || fs.exists(`${folder}/sce_sys/${name}`)) return format;
    }
    return "";
  }

export { packedFormat };
