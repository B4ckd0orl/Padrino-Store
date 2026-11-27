// The native downloader marks each durable range in a binary .resume file. The .part file's
// length can include holes or incomplete ranges, so it cannot stand in for downloaded bytes.
export function checkpointProgress(fs, destination, report = () => {}) {
  try {
    const partial = fs.stat(`${destination}.part`);
    const checkpoint = fs.stat(`${destination}.resume`);
    if (!partial?.isFile || !checkpoint?.isFile) return null;
    if (typeof fs.readBytes !== 'function') {
      report('binary filesystem read is unavailable');
      return null;
    }
    const bytes = fs.readBytes(`${destination}.resume`);
    if (!Array.isArray(bytes) || bytes.length < 97 || bytes.length !== checkpoint.size) {
      report('invalid checkpoint length');
      return null;
    }
    if (String.fromCharCode(...bytes.slice(0, 8)) !== 'P5RDL001') {
      report('invalid checkpoint magic');
      return null;
    }
    // This runtime does not expose typed arrays or DataView, so decode little-endian values
    // from the native API's ordinary byte array.
    const unsigned = (offset, length) => {
      let value = 0;
      for (let index = length - 1; index >= 0; --index) value = value * 256 + bytes[offset + index];
      return value;
    };
    const total = unsigned(8, 8), rangeBytes = unsigned(16, 8), count = unsigned(24, 4);
    if (!Number.isSafeInteger(total) || total <= 0 || !Number.isSafeInteger(rangeBytes) || rangeBytes <= 0 ||
        count !== Math.ceil(total / rangeBytes) || bytes.length !== 96 + count || partial.size > total) {
      report('invalid checkpoint layout');
      return null;
    }
    let written = 0;
    for (let index = 0; index < count; ++index) {
      const saved = bytes[96 + index];
      if (saved > 1) {
        report('invalid completed range flag');
        return null;
      }
      if (saved) {
        const begin = index * rangeBytes, end = Math.min(total, begin + rangeBytes);
        if (end > partial.size) {
          report('completed range exceeds partial file');
          return null;
        }
        written += end - begin;
      }
    }
    return { written, total, rangeBytes };
  } catch (error) {
    report(error?.message || 'checkpoint read failed');
    return null;
  }
}
