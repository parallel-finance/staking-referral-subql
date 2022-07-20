

import { SubstrateExtrinsic } from "@subql/types";
import { Contribution } from "../types";
import type { Extrinsic } from "@polkadot/types/interfaces";
import type { Vec } from "@polkadot/types";

const checkTransaction = (sectionFilter: string, methodFilter: string, call: Extrinsic) => {
    logger.info(`call, ${JSON.stringify(call)}`);
    const { section, method } = api.registry.findMetaCall(call.callIndex);
    return section === sectionFilter && method === methodFilter;
};

const handleDotContribution = async (extrinsic: SubstrateExtrinsic) => {
    const calls = extrinsic.extrinsic.args[0] as Vec<Extrinsic>;
    if (
        !checkTransaction("system", "remark", calls[0]) ||
        !checkTransaction("liquidStaking", "stake", calls[1])
    ) {
        return;
    }
    const [
        {
            args: [remarkRaw],
        },
        {
            args: [amountRaw],
        },
    ] = calls.toArray();

    const record = Contribution.create({
        id: extrinsic.extrinsic.hash.toString(),
        blockHeight: extrinsic.block.block.header.number.toNumber(),
        account: extrinsic.extrinsic.signer.toString(),
        amount: amountRaw.toString(),
        referralCode: remarkRaw.toString(),
        timestamp: extrinsic.block.timestamp,
        transactionExecuted: false,
        isValid: true,
        executedBlockHeight: null,
    });
    logger.info(JSON.stringify(record));

    await record.save();
};

export const handleBatchAll = async (extrinsic: SubstrateExtrinsic) => {
    await handleDotContribution(extrinsic);
};