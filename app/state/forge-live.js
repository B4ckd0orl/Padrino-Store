// The compression engine as the app talks to it: one client over the console's own loopback,
// waiting for a download to finish before it starts a job (the cores are shared), and keeping
// its record of what was started in the store's own state folder.

import { FileSystem, Http, Power } from '@ps5-react/core';
import { BUSY } from './download-queue.js';
import { downloadQueue } from './downloads.js';
import { createForge } from './forge.js';

  var instance;
  function forgeEngine() {
    return instance ?? (instance = createForge({
      fs: FileSystem,
      http: Http,
      power: Power,
      activeDownloads: () => {
        try {
          return downloadQueue().snapshot().some((job) => BUSY.includes(job.state));
        } catch {
          return false;
        }
      }
    }));
  }

export { forgeEngine };
