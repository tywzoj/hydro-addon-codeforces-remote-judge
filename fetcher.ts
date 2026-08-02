import { DomainModel, ProblemModel, SystemModel, yaml } from "hydrooj";

import { CE_CfApiMethod, fetchCfApi } from "./api";

const langs = `
codeforces-remote:
  execute: none
  display: Codeforces Remote
  hidden: true
  remote: codeforces-remote
codeforces-remote.submissionid:
  execute: /bin/echo For remote judge only
  highlight: text
  display: Submission ID
`;

export async function fetchCfProblems(
    { domain, owner }: { domain: string; owner: number },
    report: (data: any) => void,
): Promise<true> {
    const currentConfig = SystemModel.get("hydrooj.langs") as string;
    if (!currentConfig.includes("codeforces-remote")) {
        await SystemModel.set("hydrooj.langs", `${currentConfig}\n${langs}`);
        report({
            message: "Added Codeforces Remote Judge language configuration.",
        });
    }

    const ddoc = await DomainModel.get(domain);

    if (!ddoc) {
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
                        subType: "codeforces-remote",
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
