import { DomainModel, ProblemModel, yaml } from "hydrooj";

import { CE_CfApiMethod, fetchCfApi } from "./api";
import { VJUDGE_NAME } from "./constant";

export async function fetchCfProblems(
    { domain, owner }: { domain: string; owner: number },
    report: (data: any) => void,
): Promise<true> {
    if (!(await DomainModel.get(domain))) {
        await DomainModel.add(domain, owner, "Codeforces", "Codeforces Problemset https://codeforces.com");
        await DomainModel.edit(domain, { share: "*" });
        report({
            message: `Created domain ${domain} for Codeforces problems.`,
        });
    }

    const problems = await fetchCfApi(CE_CfApiMethod.ProblemSet_Problems, {});

    report({
        message: `Fetched ${problems.problems.length} problems from Codeforces. Starting to update the database...`,
    });
    let updatedCount = 0;
    let addedCount = 0;

    for (const problem of problems.problems) {
        if (!problem.contestId || !problem.index || !problem.name || problem.type !== "PROGRAMMING") continue;

        const problemId = `CF${problem.contestId}${problem.index}`;
        const pdoc = await ProblemModel.get(domain, problemId);

        if (pdoc) {
            await ProblemModel.edit(domain, pdoc.docId, {
                title: problem.name,
                owner,
                content: generateProblemContent(problem.contestId, problem.index, problem.name),
            });
            updatedCount++;
        } else {
            const pid = await ProblemModel.add(
                domain,
                problemId,
                problem.name,
                generateProblemContent(problem.contestId, problem.index, problem.name),
                owner,
            );
            await ProblemModel.addTestdata(
                domain,
                pid,
                "config.yaml",
                Buffer.from(
                    yaml.dump({
                        type: "remote_judge",
                        subType: VJUDGE_NAME,
                        target: problemId,
                    }),
                ),
            );
            addedCount++;
        }
    }

    report({
        message: `Updated ${updatedCount} problems and added ${addedCount} new problems to the database.`,
    });

    return true;
}

function generateProblemContent(contestId: number, index: string, name: string): string {
    const problemUrl = `https://codeforces.com/problemset/problem/${contestId}/${index}`;

    return `
请直接打开 <a href="${problemUrl}" target="_blank">Codeforces Problem ${contestId}${index}. ${name}</a> 并使用与本网站账号绑定的 Codeforces 账号登录。
提交代码后将得到的提交记录ID作为代码内容，选择任意语言提交即可评测。

Please directly open <a href="${problemUrl}" target="_blank">Codeforces Problem ${contestId}${index}. ${name}</a> and log in with the Codeforces account linked to this website account.
After submitting the code, use the submission record ID obtained as the code content, and select any language for submission to be evaluated.
    `.trim();
}
