import type { Udoc, User } from "hydrooj";

export interface CfAccountInfo {
    uname: string;
    apiKey: string;
    secret: string;
}

export interface UdocWithCfAccountInfo extends Udoc {
    cfAccountInfo?: CfAccountInfo;
}

export function getCfAccountInfo(user: User): CfAccountInfo | undefined {
    return (user._udoc as UdocWithCfAccountInfo).cfAccountInfo;
}
