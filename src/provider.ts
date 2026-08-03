import { type IBasicProvider } from "@hydrooj/vjudge";
import type { JudgeResultBody, RecordDoc } from "hydrooj";
import { moment, sleep, STATUS, UserModel } from "hydrooj";

import { CE_CfApiMethod, fetchCfApi } from "./api";
import type { ISubmission, SubmissionVerdict } from "./api.type";
import { VJUDGE_NAME } from "./constant";
import { getCfAccountInfo } from "./user";

function parseProblemId(id: string): [number, string] {
    const [, contestId, problemId] = /^CF(\d+)([A-Z]+[0-9]*)$/.exec(id) ?? [];
    if (!contestId || !problemId) {
        throw new Error(`Invalid Codeforces problem ID: ${id}`);
    }
    return [Number.parseInt(contestId, 10), problemId];
}

type ExtendedSubmissionVerdict =
    | SubmissionVerdict
    | "COMPILING"
    | "ACCEPTED"
    | "PRESENTATION_ERROR"
    | "OUTPUT_LIMIT_EXCEEDED"
    | "EXTRA_TEST_PASSED"
    | "COMPILE_ERROR"
    | "RUNNING_&_JUDGING"
    | "QUEUING"
    | "RUNNING"
    | "HAPPY_NEW_YEAR!";

const STATUS_MAP: Record<ExtendedSubmissionVerdict, STATUS> = {
    OK: STATUS.STATUS_ACCEPTED,
    PARTIAL: STATUS.STATUS_WRONG_ANSWER,
    COMPILATION_ERROR: STATUS.STATUS_COMPILE_ERROR,
    RUNTIME_ERROR: STATUS.STATUS_RUNTIME_ERROR,
    WRONG_ANSWER: STATUS.STATUS_WRONG_ANSWER,
    TIME_LIMIT_EXCEEDED: STATUS.STATUS_TIME_LIMIT_EXCEEDED,
    MEMORY_LIMIT_EXCEEDED: STATUS.STATUS_MEMORY_LIMIT_EXCEEDED,
    IDLENESS_LIMIT_EXCEEDED: STATUS.STATUS_TIME_LIMIT_EXCEEDED,
    SECURITY_VIOLATED: STATUS.STATUS_ETC,
    CRASHED: STATUS.STATUS_ETC,
    INPUT_PREPARATION_CRASHED: STATUS.STATUS_ETC,
    CHALLENGED: STATUS.STATUS_ETC,
    SKIPPED: STATUS.STATUS_IGNORED,
    TESTING: STATUS.STATUS_JUDGING,
    REJECTED: STATUS.STATUS_CANCELED,
    SUBMITTED: STATUS.STATUS_WAITING,
    FAILED: STATUS.STATUS_SYSTEM_ERROR,

    // Extended verdicts
    COMPILING: STATUS.STATUS_COMPILING,
    ACCEPTED: STATUS.STATUS_ACCEPTED,
    PRESENTATION_ERROR: STATUS.STATUS_WRONG_ANSWER,
    OUTPUT_LIMIT_EXCEEDED: STATUS.STATUS_OUTPUT_LIMIT_EXCEEDED,
    EXTRA_TEST_PASSED: STATUS.STATUS_ACCEPTED,
    COMPILE_ERROR: STATUS.STATUS_COMPILE_ERROR,
    "RUNNING_&_JUDGING": STATUS.STATUS_JUDGING,
    QUEUING: STATUS.STATUS_WAITING,
    RUNNING: STATUS.STATUS_JUDGING,
    "HAPPY_NEW_YEAR!": STATUS.STATUS_ACCEPTED,
};

export class CfRemoteProvider implements IBasicProvider {
    static Langs = {
        [VJUDGE_NAME]: {
            key: VJUDGE_NAME,
            highlight: "text",
            display: "Codeforces Remote Judge",
        },
    };

    ensureLogin() {
        return Promise.resolve(true);
    }

    getProblem() {
        return Promise.resolve({
            title: "",
            data: {},
            files: {},
            tag: [],
            content: "",
        });
    }

    listProblem() {
        return Promise.resolve([]);
    }

    async submitProblem(
        id: string,
        lang: string,
        code: string | undefined,
        info: RecordDoc,
        next: (body: Partial<JudgeResultBody>) => Promise<void> | void,
        end: (body: Partial<JudgeResultBody>) => void,
    ) {
        try {
            const normalizedCode = code?.split("\n")[0]?.trim();
            const parsedCode = normalizedCode && Number.parseInt(normalizedCode, 10);
            if (!Number.isInteger(parsedCode)) {
                throw new Error("Codeforces submission ID is not a valid integer");
            }

            await next({ status: STATUS.STATUS_JUDGING, message: "Fetching submission result..." });

            const udoc = await UserModel.getById(info.domainId, info.uid);
            const cfAccountInfo = getCfAccountInfo(udoc);

            if (!cfAccountInfo || !cfAccountInfo.uname || !cfAccountInfo.apiKey || !cfAccountInfo.secret) {
                throw new Error(
                    "Codeforces account not linked. Please link your Codeforces account in the user settings.",
                );
            }

            const [contestId, problemId] = parseProblemId(id);

            let counter = 0;
            let errorCounter = 0;
            let submission: ISubmission | undefined;

            while (true) {
                try {
                    counter++;
                    if (counter > 100) {
                        throw new Error("Submission timed out");
                    }

                    const submissions = await fetchCfApi(
                        CE_CfApiMethod.User_Status,
                        {
                            handle: cfAccountInfo.uname,
                            from: 1,
                            count: 5,
                            includeSources: true,
                        },
                        cfAccountInfo.apiKey,
                        cfAccountInfo.secret,
                    );

                    submission = submissions.find(
                        (s) =>
                            s.id === parsedCode && s.problem.contestId === contestId && s.problem.index === problemId,
                    );

                    if (!submission) {
                        end({
                            status: STATUS.STATUS_SYSTEM_ERROR,
                            message:
                                "Submission not found in the last 5 submissions. Please check your submission ID and try again.",
                        });
                        return;
                    }

                    await next({
                        status: STATUS_MAP[submission.verdict ?? "SUBMITTED"],
                        message: `Found submission submitted at ${moment(submission.creationTimeSeconds * 1000).format(
                            "YYYY-MM-DD HH:mm:ss",
                        )} with verdict: ${submission.verdict}`,
                    });

                    if (submission.verdict && submission.verdict !== "TESTING" && submission.verdict !== "SUBMITTED") {
                        break;
                    }

                    await next({ message: `Waiting for submission result... (${counter})` });

                    await sleep(counter < 50 ? 1500 : 5000);
                } catch (error) {
                    errorCounter++;
                    if (errorCounter > 5) {
                        throw error;
                    }
                    await next({ message: `Error fetching submission result. Retrying... (${errorCounter}/5)` });
                }
            }

            const status = STATUS_MAP[submission.verdict];

            end({
                status,
                score: status === STATUS.STATUS_ACCEPTED ? 100 : 0,
                message: submission.verdict ?? "Unknown verdict",
            });
        } catch (error) {
            end({
                status: STATUS.STATUS_SYSTEM_ERROR,
                message: error instanceof Error ? error.message : "An error occurred during submission",
            });
        }
    }

    waitForSubmission() {
        return Promise.resolve();
    }
}
