import { createHash, randomBytes } from "node:crypto";

import { superagent } from "hydrooj";

import type { APIRequestParams, APIResponse, APIResponseData } from "./api.type";

export const enum CE_CfApiMethod {
    ProblemSet_Problems = "problemset.problems",
    User_Status = "user.status",
}

export async function fetchCfApi<T extends CE_CfApiMethod>(
    methodName: T,
    params: APIRequestParams[T],
    apiKey?: string,
    secret?: string,
): Promise<APIResponseData[T]> {
    const url = createApiUrl(methodName, params, apiKey, secret);
    const resp = await superagent.get(url).set("Accept", "application/json");
    const body = resp.body as APIResponse<T>;
    if (body.status !== "OK") {
        throw new Error(`Codeforces API returned status: ${body.status}, comment: ${body.comment ?? "none"}`);
    }
    return body.result;
}

function createApiUrl<T extends CE_CfApiMethod>(
    methodName: T,
    params: APIRequestParams[T],
    apiKey?: string,
    secret?: string,
) {
    const entries: [string, string][] = Object.entries(params).map(([key, value]) => [key, String(value)]);
    if (apiKey) {
        entries.push(["apiKey", String(apiKey)]);
        entries.push(["time", String(Math.floor(Date.now() / 1000))]);
        entries.sort(([nameA, valueA], [nameB, valueB]) => {
            if (nameA !== nameB) return nameA < nameB ? -1 : 1;
            if (valueA !== valueB) return valueA < valueB ? -1 : 1;
            return 0;
        });
    }
    const signedQuery = new URLSearchParams(entries);
    if (secret) {
        const rand = randomBytes(3).toString("hex");
        const query = new URLSearchParams(entries).toString();
        const hash = createHash("sha512").update(`${rand}/${methodName}?${query}#${secret}`).digest("hex");
        signedQuery.append("apiSig", rand + hash);
    }

    return `https://codeforces.com/api/${methodName}?${signedQuery}`;
}
