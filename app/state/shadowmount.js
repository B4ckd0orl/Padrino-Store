// ../pub-game-store/native/state/shadowmount.js
// reconstructed from the esbuild bundle in eboot.bin


  var TTL_MS = 3e4;
  function createShadowMountProbe({ http, now }) {
    let checkedAt = -Infinity;
    let answer;
    return () => {
      if (now() - checkedAt < TTL_MS) return answer;
      checkedAt = now();
      answer = http.request("http://127.0.0.1:10101/api/v1/version", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
        maxBytes: 64 * 1024
      }).then(() => true, () => {
        checkedAt = -Infinity;
        return false;
      });
      return answer;
    };
  }
  async function shadowRequest(http, route, body = {}) {
    let response;
    try {
      response = await http.request(`http://127.0.0.1:10101/api/v1/${route}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        maxBytes: 1024 * 1024
      });
    } catch (error2) {
      error2.unreachable = true;
      throw error2;
    }
    if (!response.ok) {
      const reason = await response.json().then((reply) => reply?.error, () => "");
      throw new Error(`ShadowMount HTTP ${response.status}${reason ? `: ${reason}` : ""}.`);
    }
    return response.json();
  }
  function within2(path, paths, root2) {
    const target = path?.replace(/\/+$/, "");
    if (!target) return false;
    return paths.some((base) => {
      const tail = base.startsWith(`${root2}/`) ? base.slice(root2.length) : null;
      return target === base || target.startsWith(`${base}/`) || tail && (target.endsWith(tail) || target.includes(`${tail}/`));
    });
  }
  async function mountedImages(request, paths, root2) {
    let reply;
    try {
      reply = await request("images");
    } catch (error2) {
      if (error2.unreachable) return null;
      throw error2;
    }
    return (reply.images ?? []).filter((image) => image.mounted && within2(image.path, paths, root2));
  }
  // A storage job (games/move) returns 202 {job_id}; poll games/storage/status until
  // done. One storage job at a time — a second returns 409 EBUSY.
  async function storageJob(http, { route, body, onProgress, pollMs = 700, signal }) {
    const start = await shadowRequest(http, route, body);
    const jobId = start.job_id;
    if (!jobId) throw new Error("ShadowMount did not return a job id.");
    for (;;) {
      if (signal?.aborted) {
        await shadowRequest(http, "games/storage/cancel", { job_id: jobId }).catch(() => {});
        throw new Error("Move cancelled.");
      }
      await new Promise((resolve2) => setTimeout(resolve2, pollMs));
      const status = await shadowRequest(http, "games/storage/status", { job_id: jobId });
      onProgress?.(status);
      if (status.phase === "done" || status.phase === "completed") return status;
      if (status.phase === "failed" || status.phase === "error") {
        throw new Error(status.error || status.result?.error || "Move failed.");
      }
      if (status.phase === "cancelled") throw new Error("Move cancelled.");
    }
  }

export { createShadowMountProbe, mountedImages, shadowRequest, storageJob, within2 };
