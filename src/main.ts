import type { Context } from "hydrooj";
import { Schema } from "hydrooj";

import { CODEFORCES_REMOTE_WORKER_COUNT, VJUDGE_NAME } from "./constant";
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
        for (let worker = 1; worker <= CODEFORCES_REMOTE_WORKER_COUNT; worker++) {
            const handle = `worker-${worker}`;
            const _id = `${VJUDGE_NAME}-${handle}`;
            if (!c.vjudge.accounts.some((account) => account._id === _id)) {
                c.vjudge.accounts.push({
                    _id,
                    type: VJUDGE_NAME,
                    handle,
                    password: "",
                });
            }
        }
        c.vjudge.addProvider(VJUDGE_NAME, CfRemoteProvider);
    });

    applyHandlers(ctx);
    applyI18n(ctx);
}
