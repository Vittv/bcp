import { describe, expect, it } from "bun:test";
import { createHistoryController, type HistoryPlatform } from "../history";

// the concrete snapshot shape the fake exercises the generic controller with
type Snap = {
  page: string;
  psalm: number | null;
};

// a snapshot plus the null a blank browser entry carries
type EntryState = Partial<Snap> | null;

type FakePlatform = HistoryPlatform<Snap> & {
  entries: { state: Partial<Snap> }[];
  pop: (state: EntryState) => void;
  listenerCount: () => number;
};

function makePlatform(): FakePlatform {
  const listeners = new Set<(e: PopStateEvent) => void>();
  const entries: { state: Partial<Snap> }[] = [];
  // the current position in the stack, so replaceState rewrites in place and
  // pushState clears the forward entries, mirroring the browser
  let index = 0;
  const platform: FakePlatform = {
    seedUrl: "https://app.example/",
    history: {
      pushState: (state: Partial<Snap>) => {
        entries.splice(index + 1);
        entries.push({ state });
        index = entries.length - 1;
      },
      replaceState: (state: Partial<Snap>) => {
        if (entries.length === 0) entries.push({ state });
        else entries[index] = { state };
      },
    },
    addEventListener: (_type, cb) => {
      listeners.add(cb);
    },
    removeEventListener: (_type, cb) => {
      listeners.delete(cb);
    },
    entries,
    pop: (state: EntryState) => {
      for (const cb of listeners) {
        // SAFETY: the dispatched event only ever carries the plain snapshot
        // this fake built, which matches what the controller reads off e.state
        cb({ state } as PopStateEvent);
      }
    },
    listenerCount: () => listeners.size,
  };
  return platform;
}

describe("createHistoryController", () => {
  it("seeds the initial state via replaceState on the first push", () => {
    const platform = makePlatform();
    const ctl = createHistoryController<Snap>(platform);
    ctl.register(
      "page",
      () => "today",
      () => {},
    );
    ctl.push({ page: "psalms" });
    expect(platform.entries).toHaveLength(2);
    expect(platform.entries[0].state).toEqual({ page: "today" });
    expect(platform.entries[1].state).toEqual({ page: "psalms" });
  });

  it("merges pushed fields over the registered getters", () => {
    const platform = makePlatform();
    const ctl = createHistoryController<Snap>(platform);
    ctl.register(
      "page",
      () => "today",
      () => {},
    );
    ctl.register(
      "psalm",
      () => null,
      () => {},
    );
    ctl.push({ page: "psalms", psalm: 23 });
    expect(platform.entries[1].state).toEqual({ page: "psalms", psalm: 23 });
  });

  it("restores registered fields on popstate and notifies listeners", () => {
    const platform = makePlatform();
    const ctl = createHistoryController<Snap>(platform);
    const applied: Array<{ page: string; psalm: number | null }> = [];
    ctl.register(
      "page",
      () => "today",
      (v) => {
        applied.push({ page: v, psalm: null });
      },
    );
    ctl.register(
      "psalm",
      () => null,
      (v) => {
        const last = applied[applied.length - 1];
        if (last) last.psalm = v;
      },
    );
    let notified = 0;
    ctl.onRestored(() => {
      notified += 1;
    });
    ctl.start();
    platform.pop({ page: "psalms", psalm: 23 });
    expect(applied).toEqual([{ page: "psalms", psalm: 23 }]);
    expect(notified).toBe(1);
  });

  it("forward navigation restores the newer snapshot again", () => {
    const platform = makePlatform();
    const ctl = createHistoryController<Snap>(platform);
    let page = "psalms";
    ctl.register(
      "page",
      () => page,
      (v) => {
        page = v;
      },
    );
    ctl.start();
    platform.pop({ page: "saints" });
    expect(page).toBe("saints");
    platform.pop({ page: "psalms" });
    expect(page).toBe("psalms");
  });

  it("ignores popstate entries with no object state (blank browser entries)", () => {
    const platform = makePlatform();
    const ctl = createHistoryController<Snap>(platform);
    let applied = false;
    ctl.register(
      "page",
      () => "today",
      () => {
        applied = true;
      },
    );
    ctl.start();
    platform.pop(null);
    expect(applied).toBe(false);
  });

  it("suppresses pushes while a restore is in flight", () => {
    const platform = makePlatform();
    const ctl = createHistoryController<Snap>(platform);
    const applied: { psalm: number | null }[] = [];
    ctl.register(
      "psalm",
      () => null,
      (v) => {
        applied.push({ psalm: v });
        // an apply path that tries to push its own entry must be a no-op
        ctl.push({ psalm: v });
      },
    );
    ctl.start();
    platform.pop({ psalm: 12 });
    expect(applied).toHaveLength(1);
    expect(platform.entries).toEqual([]);
  });

  it("skips pushes that change nothing", () => {
    const platform = makePlatform();
    const ctl = createHistoryController<Snap>(platform);
    ctl.register(
      "psalm",
      () => 23,
      () => {},
    );
    ctl.push({ psalm: 23 });
    expect(platform.entries).toEqual([]);
  });

  it("replace rewrites the current entry without adding a step", () => {
    const platform = makePlatform();
    const ctl = createHistoryController<Snap>(platform);
    ctl.register(
      "page",
      () => "today",
      () => {},
    );
    ctl.push({ page: "psalms" });
    ctl.replace({ page: "saints" });
    expect(platform.entries).toHaveLength(2);
    expect(platform.entries[0].state).toEqual({ page: "today" });
    expect(platform.entries[1].state).toEqual({ page: "saints" });
  });

  it("replace still rewrites when the change equals the current state", () => {
    const platform = makePlatform();
    const ctl = createHistoryController<Snap>(platform);
    ctl.register(
      "page",
      () => "psalms",
      () => {},
    );
    ctl.record();
    ctl.replace({ page: "psalms" });
    // the seed and the recorded step stay one entry each: the replace folds
    // the recorded step into a plain entry instead of growing the stack
    expect(platform.entries).toHaveLength(2);
    expect(platform.entries[1].state).toEqual({ page: "psalms" });
  });

  it("replace is suppressed while a restore is in flight", () => {
    const platform = makePlatform();
    const ctl = createHistoryController<Snap>(platform);
    ctl.register(
      "psalm",
      () => null,
      () => {
        ctl.replace({ psalm: 12 });
      },
    );
    ctl.start();
    platform.pop({ psalm: 12 });
    expect(platform.entries).toEqual([]);
  });

  it("record pushes the live snapshot even when it equals the current state", () => {
    const platform = makePlatform();
    const ctl = createHistoryController<Snap>(platform);
    ctl.register(
      "psalm",
      () => null,
      () => {},
    );
    ctl.record();
    ctl.record();
    // the seed entry plus the two recorded steps
    expect(platform.entries).toHaveLength(3);
    expect(platform.entries[1].state).toEqual({ psalm: null });
    expect(platform.entries[2].state).toEqual({ psalm: null });
  });

  it("record stays quiet when nothing is registered yet", () => {
    const platform = makePlatform();
    const ctl = createHistoryController<Snap>(platform);
    ctl.record();
    expect(platform.entries).toEqual([]);
  });

  it("record is suppressed while a restore is in flight", () => {
    const platform = makePlatform();
    const ctl = createHistoryController<Snap>(platform);
    ctl.register(
      "psalm",
      () => null,
      () => {
        ctl.record();
      },
    );
    ctl.start();
    platform.pop({ psalm: 12 });
    expect(platform.entries).toEqual([]);
  });

  it("skips restoring fields that already match the live state but still notifies", () => {
    const platform = makePlatform();
    const ctl = createHistoryController<Snap>(platform);
    let psalm: number | null = 5;
    const applied: (number | null)[] = [];
    ctl.register(
      "psalm",
      () => psalm,
      (v) => {
        psalm = v;
        applied.push(v);
      },
    );
    let notified = 0;
    ctl.onRestored(() => {
      notified += 1;
    });
    ctl.start();
    platform.pop({ psalm: 5 });
    expect(applied).toEqual([]);
    expect(notified).toBe(1);
    platform.pop({ psalm: 8 });
    expect(applied).toEqual([8]);
  });

  it("unregister removes a field from pushes and restores", () => {
    const platform = makePlatform();
    const ctl = createHistoryController<Snap>(platform);
    const seen: string[] = [];
    const offPage = ctl.register(
      "page",
      () => "today",
      (v) => {
        seen.push(`page:${v}`);
      },
    );
    ctl.register(
      "psalm",
      () => 3,
      (v) => {
        seen.push(`psalm:${v}`);
      },
    );
    offPage();
    ctl.push({ page: "proverbs" });
    expect(platform.entries[0].state).toEqual({ psalm: 3 });
    expect(platform.entries[1].state).toEqual({ psalm: 3, page: "proverbs" });
    ctl.start();
    platform.pop({ page: "saints", psalm: 15 });
    expect(seen).toEqual(["psalm:15"]);
  });

  it("start/stop subscribe and unsubscribe the popstate listener", () => {
    const platform = makePlatform();
    const ctl = createHistoryController<Snap>(platform);
    let applied = false;
    ctl.register(
      "page",
      () => "today",
      () => {
        applied = true;
      },
    );
    ctl.start();
    expect(platform.listenerCount()).toBe(1);
    platform.pop({ page: "psalms" });
    expect(applied).toBe(true);
    ctl.stop();
    expect(platform.listenerCount()).toBe(0);
    applied = false;
    platform.pop({ page: "psalms" });
    expect(applied).toBe(false);
  });

  it("onRestored listener cleanup stops notifications", () => {
    const platform = makePlatform();
    const ctl = createHistoryController<Snap>(platform);
    let notified = 0;
    const cleanup = ctl.onRestored(() => {
      notified += 1;
    });
    ctl.start();
    platform.pop({ page: "psalms" });
    expect(notified).toBe(1);
    cleanup();
    platform.pop({ page: "saints" });
    expect(notified).toBe(1);
  });

  it("isRestoring is true while applying and false after", () => {
    const platform = makePlatform();
    const ctl = createHistoryController<Snap>(platform);
    const flag: boolean[] = [];
    ctl.register(
      "page",
      () => "today",
      () => {
        flag.push(ctl.isRestoring());
      },
    );
    ctl.start();
    platform.pop({ page: "psalms" });
    expect(flag).toEqual([true]);
    expect(ctl.isRestoring()).toBe(false);
  });
});
