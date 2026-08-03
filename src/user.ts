import { type Udoc, type User, UserModel } from "hydrooj";

export interface CfAccountInfo {
    uname: string;
    apiKey: string;
    secret: string;
}

export interface UdocWithCfAccountInfo extends Udoc {
    cfAccountInfo?: CfAccountInfo;
}

export function getCfAccountInfo(user: User | Udoc): CfAccountInfo | undefined {
    return ((user._udoc ?? user) as UdocWithCfAccountInfo).cfAccountInfo;
}

export async function setCfAccountInfo(uid: number, info: CfAccountInfo): Promise<CfAccountInfo> {
    const $set: Partial<UdocWithCfAccountInfo> = {
        cfAccountInfo: info,
    };

    const udoc = await UserModel.setById(uid, $set);

    return (udoc as UdocWithCfAccountInfo).cfAccountInfo!;
}
