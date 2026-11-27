// Rebuild queue rows from native download sidecars after a power loss. The source is selected only
// when its catalog match is unambiguous; the native worker validates the checkpoint on Resume.
export function recoverPackageJobs({ fs, jobs, gameOf, releasesOf, formats }) {
  const folder = '/data/downloads/packages';
  let entries;
  try {
    entries = fs.readDir(folder);
  } catch {
    return [];
  }
  const recovered = [];
  for (const entry of entries.slice(0, 512)) {
    if (jobs.length + recovered.length >= 32 || !/\.pkg\.part$/i.test(entry.name || '')) continue;
    const filename = entry.name.slice(0, -5);
    const titleId = /(?:^|[^A-Z0-9])((?:PPSA|CUSA|PCSA)\d{5})(?=[^A-Z0-9]|$)/i.exec(filename)?.[1]?.toUpperCase();
    const game = titleId && gameOf(titleId);
    if (!game) continue;
    const destination = `${folder}/${filename}`;
    if ([...jobs, ...recovered].some(job => job.downloadDestination === destination || job.artifact?.destination === destination || job.gameId === game.id)) continue;
    let partial, checkpoint, exists;
    try {
      partial = fs.stat(`${destination}.part`);
      checkpoint = fs.stat(`${destination}.resume`);
      exists = fs.exists(destination);
    } catch {
      continue;
    }
    if (!partial?.isFile || !checkpoint?.isFile || exists) continue;
    const candidates = releasesOf(game.id).filter(release => !release.parts && !release.unavailableReason &&
      ['pkg', 'fpkg'].includes(release.format) && (release.url || release.browserUrl));
    const exact = candidates.filter(release => release.filename === filename);
    const release = exact.length === 1 ? exact[0] : candidates.length === 1 ? candidates[0] : null;
    if (!release) continue;
    let artifact;
    try {
      artifact = formats.artifact({ ...release, filename }, '/data');
    } catch {
      continue;
    }
    if (artifact.destination !== destination) continue;
    // sizeof(native Checkpoint) is 96, followed by one byte for each range. The catalog's
    // reported size may differ slightly from the host's; use it only to identify the range width.
    // Native still checks the checkpoint's exact size, validator and identity before resuming.
    const total = release.sizeBytes;
    const ranges = Number.isSafeInteger(checkpoint.size) && checkpoint.size > 96 ? checkpoint.size - 96 : 0;
    const widths = [4, 16, 32].map(mb => mb * 1024 * 1024);
    const closest = Number.isSafeInteger(total) && total > 0 && ranges ? widths.reduce((best, bytes) =>
      Math.abs(total / bytes - ranges) < Math.abs(total / best - ranges) ? bytes : best) : null;
    const rangeBytes = closest && Math.abs(total / closest - ranges) / ranges < 0.25 ? closest : null;
    recovered.push({
      id: `${game.id}/${release.id}`, gameId: game.id, titleId: release.titleId || game.titleId || game.id,
      title: game.title, release: { ...release }, requestedId: release.id, root: '/data',
      artifact, downloadDestination: destination, streamMode: 'here', state: 'paused',
      written: 0, total: total || null, error: '', adopted: true,
      ...(rangeBytes ? { checkpointRangeBytes: rangeBytes } : {})
    });
  }
  return recovered;
}
