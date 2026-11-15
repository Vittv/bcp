// Bundled eager exports for fully-offline/native app builds.
import b_1esd from "./1esd.json";
import b_1macc from "./1macc.json";
import b_2esd from "./2esd.json";
import b_2macc from "./2macc.json";
import b_bar from "./bar.json";
import b_bel from "./bel.json";
import b_jdt from "./jdt.json";
import b_prman from "./prman.json";
import b_restesth from "./restesth.json";
import b_s3y from "./s3y.json";
import b_sir from "./sir.json";
import b_sus from "./sus.json";
import b_tob from "./tob.json";
import b_wis from "./wis.json";

import type { KjvBook } from "../../types";

type BundledKjvBook = Omit<KjvBook, "testament"> & { testament: string };

export const books: Record<string, BundledKjvBook> = { "b_1esd": b_1esd, "b_1macc": b_1macc, "b_2esd": b_2esd, "b_2macc": b_2macc, "b_bar": b_bar, "b_bel": b_bel, "b_jdt": b_jdt, "b_prman": b_prman, "b_restesth": b_restesth, "b_s3y": b_s3y, "b_sir": b_sir, "b_sus": b_sus, "b_tob": b_tob, "b_wis": b_wis };
