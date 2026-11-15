// Prefetch all scripture book chunks in the background so the PWA works fully
// offline after the shell has loaded. Each loader performs a dynamic import;
// on web the service worker caches the resulting static chunk for offline use.
import { loaders as kjvLoaders } from "./vendor/kjv/loaders";
import { loaders as kjvaLoaders } from "./vendor/kjva/loaders";
import { loaders as webLoaders } from "./vendor/web/loaders";

const ALL_LOADERS = [
  ...Object.values(kjvLoaders),
  ...Object.values(kjvaLoaders),
  ...Object.values(webLoaders),
];

function idle(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof requestIdleCallback === "function") {
      requestIdleCallback(() => resolve(), { timeout: 2000 });
    } else {
      setTimeout(resolve, 200);
    }
  });
}

export async function prefetchAllScripture(concurrency = 2): Promise<void> {
  let i = 0;
  const run = async () => {
    while (i < ALL_LOADERS.length) {
      const idx = i++;
      const load = ALL_LOADERS[idx];
      try {
        await load();
      } catch {
        // ignore: offline or transient failure; a later open can retry
      }
      await idle();
    }
  };
  await Promise.all(Array.from({ length: concurrency }, () => run()));
}
