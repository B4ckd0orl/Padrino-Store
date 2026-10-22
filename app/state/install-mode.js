// Padrino Store — install-mode detection.
// The store can run three ways on PS5: from an exFAT image, from a data folder, or as a
// raw payload (.elf via elfldr/etaHEN). An installed app always has its sandbox mounted,
// so /download0 exists; a payload process has no app sandbox at all — the same signal the
// download queue already works around by writing under /data/ps5-react.

import { FileSystem, Platform } from '@ps5-react/core';

  var PAYLOAD_DATA = "/data/ps5-react/PPSA99059";
  var payload = Platform.OS === "ps5" ? !FileSystem.exists("/download0") : false;
  function isPayloadMode() {
    return payload;
  }

export { PAYLOAD_DATA, isPayloadMode };
