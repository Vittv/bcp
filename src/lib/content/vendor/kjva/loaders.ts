// Lazy loaders for per-book chunking (avoid bundling all books eagerly).
export const loaders: Record<string, () => Promise<{ default: unknown }>> = {
  "b_1esd": () => import("./1esd.json"),
  "b_1macc": () => import("./1macc.json"),
  "b_2esd": () => import("./2esd.json"),
  "b_2macc": () => import("./2macc.json"),
  "b_bar": () => import("./bar.json"),
  "b_bel": () => import("./bel.json"),
  "b_jdt": () => import("./jdt.json"),
  "b_prman": () => import("./prman.json"),
  "b_restesth": () => import("./restesth.json"),
  "b_s3y": () => import("./s3y.json"),
  "b_sir": () => import("./sir.json"),
  "b_sus": () => import("./sus.json"),
  "b_tob": () => import("./tob.json"),
  "b_wis": () => import("./wis.json"),
};
