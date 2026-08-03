import type { Context } from "hydrooj";

import { PAGE_NAME } from "./constant";

const SETTING_TITLE = "Codeforces Account";

export function applyI18n(ctx: Context) {
    ctx.i18n.load("zh", {
        [PAGE_NAME]: "Codeforces 设置",
        [SETTING_TITLE]: "Codeforces 账号",
    });
    ctx.i18n.load("en", {
        [PAGE_NAME]: "Codeforces Setting",
    });
}
