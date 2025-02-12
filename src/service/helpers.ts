//src/service/helpers.ts

import {
  type Address,
  MarketParams,
  UnknownMarketParamsError,
  getUnwrappedToken,
} from "@morpho-org/blue-sdk";

import {
  type BundlingOptions,
  type InputBundlerOperation,
  encodeBundle,
  finalizeBundle,
  populateBundle,
} from "@morpho-org/bundler-sdk-viem";

import { withSimplePermit } from "@morpho-org/morpho-test";
import {
  type SimulationState,
  isBlueOperation,
  isErc20Operation,
  isMetaMorphoOperation,
} from "@morpho-org/simulation-sdk";

import { type Account, WalletClient, zeroAddress } from "viem";
import { parseAccount } from "viem/accounts";

export const setupBundle = async (
  client: WalletClient,
  startData: SimulationState,
  inputOperations: InputBundlerOperation[],
  {
    account: account_ = client.account,
    supportsSignature,
    unwrapTokens,
    unwrapSlippage,
    onBundleTx,
    ...options
  }: BundlingOptions & {
    account?: Address | Account;
    supportsSignature?: boolean;
    unwrapTokens?: Set<Address>;
    unwrapSlippage?: bigint;
    onBundleTx?: (data: SimulationState) => Promise<void> | void;
  } = {}
) => {
  if (!account_) throw new Error("Account is required");
  const account = parseAccount(account_);

  let { operations } = populateBundle(inputOperations, startData, {
    ...options,
    withSimplePermit: new Set([
      ...withSimplePermit[startData.chainId],
      ...(options?.withSimplePermit ?? []),
    ]),
    publicAllocatorOptions: {
      enabled: true,
      ...options.publicAllocatorOptions,
    },
  });
  operations = finalizeBundle(
    operations,
    startData,
    account.address,
    unwrapTokens,
    unwrapSlippage
  );

  const bundle = encodeBundle(operations, startData, supportsSignature);

  const tokens = new Set<Address>();

  operations.forEach((operation) => {
    const { address } = operation;

    if (
      isBlueOperation(operation) &&
      operation.type !== "Blue_SetAuthorization"
    ) {
      try {
        const marketParams = MarketParams.get(operation.args.id);

        if (marketParams.loanToken !== zeroAddress)
          tokens.add(marketParams.loanToken);

        if (marketParams.collateralToken !== zeroAddress)
          tokens.add(marketParams.collateralToken);
      } catch (error) {
        if (!(error instanceof UnknownMarketParamsError)) throw error;
      }
    }

    if (isMetaMorphoOperation(operation)) {
      tokens.add(address);

      const vault = startData.tryGetVault(address);
      if (vault) tokens.add(vault.asset);
    }

    if (isErc20Operation(operation)) {
      tokens.add(address);

      const unwrapped = getUnwrappedToken(address, startData.chainId);
      if (unwrapped != null) tokens.add(unwrapped);
    }
  });

  await onBundleTx?.(startData);

  // here EOA should sign tx
  await Promise.all(
    bundle.requirements.signatures.map((requirement) =>
      requirement.sign(client, account)
    )
  );

  const txs = bundle.requirements.txs.map(({ tx }) => tx).concat([bundle.tx()]);

  for (const tx of txs) {
    await client.sendTransaction(
      // @ts-expect-error bypassing type check
      { ...tx, account }
    );
  }

  //   const { bundler } = getChainAddresses(startData.chainId);

  //   await Promise.all(
  //     [...tokens].map(async (token) => {
  //       const balance = await client.balanceOf({ erc20: token, owner: bundler });

  //       expect(
  //         format.number.of(balance, startData.getToken(token).decimals)
  //       ).toBeCloseTo(0, 8);
  //     })
  //   );

  return { operations, bundle };
};
