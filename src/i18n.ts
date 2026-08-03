import type { Context } from "hydrooj";

import { PAGE_NAME } from "./constant";

const SETTING_TITLE = "Codeforces Account";
const SETTING_HINT = "You can get your Codeforces API Key and Secret from {0}";

export function applyI18n(ctx: Context) {
    ctx.i18n.load("zh", {
        [PAGE_NAME]: "Codeforces 设置",
        [SETTING_TITLE]: "Codeforces 账号",
        [SETTING_HINT]: "你可以从 {0} 获取你的 Codeforces API Key 和 Secret。",
    });
    ctx.i18n.load("en", {
        [PAGE_NAME]: "Codeforces Setting",
    });
}
