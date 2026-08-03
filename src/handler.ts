import type { Context } from "hydrooj";
import { BadRequestError, Handler, param, PRIV, requireSudo, Types } from "hydrooj";

import { CE_CfApiMethod, fetchCfApi } from "./api";
import { PAGE_NAME } from "./constant";
import { getCfAccountInfo, setCfAccountInfo } from "./user";

class HomeCodeforcesSettingHandler extends Handler {
    @requireSudo
    get() {
        const accountInfo = getCfAccountInfo(this.user);

        this.response.template = "codeforces_setting.html";
        this.response.body = {
            accountInfo,
        };
    }

    @requireSudo
    @param("uname", Types.String)
    @param("apiKey", Types.String)
    @param("secret", Types.String)
    async post(_, uname: string, apiKey: string, secret: string) {
        try {
            await fetchCfApi(
                CE_CfApiMethod.User_Status,
                { handle: uname, from: 1, count: 1, includeSources: true },
                apiKey,
                secret,
            );
        } catch {
            throw new BadRequestError(
                "Invalid Codeforces account information. Please check your username, API key, and secret.",
            );
        }

        const accountInfo = await setCfAccountInfo(this.user._id, {
            uname,
            apiKey,
            secret,
        });

        this.response.template = "codeforces_setting.html";
        this.response.body = {
            accountInfo,
        };
    }
}

export function applyHandlers(ctx: Context) {
    ctx.Route(PAGE_NAME, `/home/codeforces_setting`, HomeCodeforcesSettingHandler, PRIV.PRIV_USER_PROFILE);
}
