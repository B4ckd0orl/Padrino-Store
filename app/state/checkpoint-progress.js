// The native downloader marks each durable range in a binary .resume file. The .part file's
// length can include holes or incomplete ranges, so it cannot stand in for downloaded bytes.
export function checkpointProgress(fs, destination) {
  try {
    const partial = fs.stat(`${destination}.part`);
    const checkpoint = fs.stat(`${destination}.resume`);
    if (!partial?.isFile || !checkpoint?.isFile || typeof fs.readBytes !== 'function') return null;
    const bytes = fs.readBytes(`${destination}.resume`);
    if (!(bytes instanceof Uint8Array) || bytes.length < 97 || bytes.length !== checkpoint.size) return null;
    if (String.fromCharCode(...bytes.subarray(0, 8)) !== 'P5RDL001') return null;
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const number64 = offset => view.getUint32(offset, true) + view.getUint32(offset + 4, true) * 2 ** 32;
    const total = number64(8), rangeBytes = number64(16), count = view.getUint32(24, true);
    if (!Number.isSafeInteger(total) || total <= 0 || !Number.isSafeInteger(rangeBytes) || rangeBytes <= 0 ||
        count !== Math.ceil(total / rangeBytes) || bytes.length !== 96 + count || partial.size > total) return null;
    let written = 0;
    for (let index = 0; index < count; ++index) {
      const saved = bytes[96 + index];
      if (saved > 1) return null;
      if (saved) {
        const begin = index * rangeBytes, end = Math.min(total, begin + rangeBytes);
        if (end > partial.size) return null;
        written += end - begin;
      }
    }
    return { written, total, rangeBytes };
  } catch {
    return null;
  }
}
