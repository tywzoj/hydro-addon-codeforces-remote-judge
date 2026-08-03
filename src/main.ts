import type { Context } from "hydrooj";
import { Schema } from "hydrooj";

import { VJUDGE_NAME } from "./constant";
import { fetchCfProblems } from "./fetcher";
import { applyHandlers } from "./handler";
import { applyI18n } from "./i18n";
import { CfRemoteProvider } from "./provider";

export function apply(ctx: Context) {
    ctx.addScript(
        "fetchCodeforcesProblem",
        "Fetch Codeforces Problem",
        Schema.object({
            domain: Schema.string().default("codeforces"),
            owner: Schema.number().default(2),
        }),
        fetchCfProblems,
    );

    ctx.inject(["vjudge"], (c) => {
        c.vjudge.accounts.push({
            _id: VJUDGE_NAME,
            type: VJUDGE_NAME,
            handle: "",
            password: "",
        });
        c.vjudge.addProvider(VJUDGE_NAME, CfRemoteProvider);
    });

    applyHandlers(ctx);
    applyI18n(ctx);
}
