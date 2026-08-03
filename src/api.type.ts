import type { CE_CfApiMethod } from "./api";

export type APIRequestParams = {
    [CE_CfApiMethod.ProblemSet_Problems]: {
        tags?: string;
        problemsetName?: string;
    };
    [CE_CfApiMethod.User_Status]: {
        handle: string;
        from?: number;
        count?: number;
        includeSources?: boolean;
    };
};

export type APIResponse<T extends CE_CfApiMethod> =
    { status: "OK"; result: APIResponseData[T] } | { status: "FAILED"; comment?: string };

export type APIResponseData = {
    [CE_CfApiMethod.ProblemSet_Problems]: {
        problems: IProblem[];
        problemStatistics: unknown[];
    };
    [CE_CfApiMethod.User_Status]: ISubmission[];
};

export interface IProblem {
    /**
     * Id of the contest, containing the problem.
     */
    contestId?: number;

    /**
     * Short name of the problemset the problem belongs to.
     */
    problemsetName?: string;

    /**
     * Usually, a letter or letter with digit(s) indicating the problem index in a contest.
     */
    index: string;
    name: string;
    type: "PROGRAMMING" | "QUESTION";

    /**
     * Maximum amount of points for the problem.
     */
    points?: number;

    /**
     * Problem rating (difficulty).
     */
    rating?: number;

    /**
     * Problem tags.
     */
    tags: string[];
}

export type SubmissionVerdict =
    | "FAILED"
    | "OK"
    | "PARTIAL"
    | "COMPILATION_ERROR"
    | "RUNTIME_ERROR"
    | "WRONG_ANSWER"
    | "TIME_LIMIT_EXCEEDED"
    | "MEMORY_LIMIT_EXCEEDED"
    | "IDLENESS_LIMIT_EXCEEDED"
    | "SECURITY_VIOLATED"
    | "CRASHED"
    | "INPUT_PREPARATION_CRASHED"
    | "CHALLENGED"
    | "SKIPPED"
    | "TESTING"
    | "REJECTED"
    | "SUBMITTED";

export type SubmissionTestSet =
    | "SAMPLES"
    | "PRETESTS"
    | "TESTS"
    | "CHALLENGES"
    | "TESTS1"
    | "TESTS2"
    | "TESTS3"
    | "TESTS4"
    | "TESTS5"
    | "TESTS6"
    | "TESTS7"
    | "TESTS8"
    | "TESTS9"
    | "TESTS10";

export interface ISubmission {
    id: number;
    contestId?: number;

    /**
     * Time, when submission was created, in unix-format.
     */
    creationTimeSeconds: number;

    /**
     * Number of seconds, passed after the start of the contest (or a virtual start for virtual parties), before the submission.
     */
    relativeTimeSeconds: number;

    problem: IProblem;
    author: unknown;
    programmingLanguage: string;
    verdict?: SubmissionVerdict;

    /**
     * Testset used for judging the submission.
     */
    testset?: SubmissionTestSet;

    /**
     * Number of passed tests.
     */
    passedTestCount: number;

    /**
     * Maximum time in milliseconds, consumed by solution for one test.
     */
    timeConsumedMillis: number;

    /**
     * Maximum memory in bytes, consumed by solution for one test.
     */
    memoryConsumedBytes: number;

    /**
     * Can be absent. Number of scored points for IOI-like contests.
     */
    points?: number;
}
