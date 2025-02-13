// src/hooks/usePopulatedSimulationState.ts
import { useMemo } from "react";
import { useBlock, useWalletClient } from "wagmi";
import {
  getChainAddresses,
  MarketId,
  NATIVE_ADDRESS,
} from "@morpho-org/blue-sdk";
import {
  SimulationStateLike,
  useSimulationState,
} from "@morpho-org/simulation-sdk-wagmi";
import { markets } from "@morpho-org/morpho-test";
import { ReadContractErrorType } from "viem";

export const usePopulatedSimulationState = (marketId: MarketId) => {
  const client = useWalletClient();
  const { data: block } = useBlock({
    chainId: undefined,
    watch: true,
  });

  const address = client.data?.account?.address;

  const targetChainId = client.data?.chain.id ?? 1;
  // If we're on Anvil (31337), use mainnet addresses for testing
  const effectiveChainId = targetChainId === 31337 ? 1 : targetChainId ?? 1;

  // Derive the bundler address from the SDK for the current chain
  // Use effectiveChainId instead of targetChainId
  const bundler = useMemo(() => {
    const chainAddresses = getChainAddresses(effectiveChainId);
    return chainAddresses?.bundler;
  }, [effectiveChainId]);

  // Create the list of users (only the account and bundler, for example)
  const users = useMemo(() => {
    const list: string[] = [];
    if (address) list.push(address);
    if (bundler) list.push(bundler);
    return list;
  }, [address, bundler]);

  // Use effectiveChainId for tokens
  // below we are using the sUSDe/DAI market, so we need the following tokens:
  // - DAI
  // - sUSDe
  // - DAI_sUSDe
  const tokens = useMemo<string[]>(() => {
    const chainAddresses = getChainAddresses(effectiveChainId);

    const dai = chainAddresses.dai!;
    const { dai_sUsde } = markets[effectiveChainId as keyof typeof markets];

    return [NATIVE_ADDRESS, dai, dai_sUsde.collateralToken];
  }, [effectiveChainId]);

  // if any vaults are needed, add them here
  const vaults = useMemo<string[]>(() => [], []);

  // Helper function to extract a meaningful error message
  const getSimulationErrorMessage = (
    error: SimulationStateLike<ReadContractErrorType | null>
  ): string | null => {
    if (!error) return null;
    if (error instanceof Error) return error.message;
    // Define keys that represent error details from the simulation
    const errorKeys = [
      "global",
      "markets",
      "users",
      "tokens",
      "vaults",
      "positions",
      "holdings",
      "vaultMarketConfigs",
      "vaultUsers",
    ];

    // Check if at least one key has a non-null/non-undefined error value.
    // For the global error, check its nested property.
    const hasRealError = errorKeys.some((key) => {
      if (key === "global") {
        return error.global?.feeRecipient != null;
      }
      // @ts-expect-error error is a SimulationStateLike
      return error[key] != null;
    });
    return hasRealError ? JSON.stringify(error, null, 2) : null;
  };

  let simulation;

  try {
    simulation = useSimulationState({
      marketIds: [marketId],
      users: users as `0x${string}`[],
      tokens: tokens as `0x${string}`[],
      vaults: vaults as `0x${string}`[],
      block: block
        ? {
            number: block.number,
            timestamp: block.timestamp,
          }
        : undefined,
    });

    const errorMessage = getSimulationErrorMessage(simulation.error);
    if (errorMessage) {
      console.error("Simulation error details:", {
        error: simulation.error,
        errorMessage,
      });
    }
  } catch (error) {
    console.error("Error in useSimulationState:", {
      error,
      errorMessage: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }

  return {
    simulationState: simulation.data,
    isPending: simulation.isPending,
    error: getSimulationErrorMessage(simulation.error),
    config: {
      marketIds: [marketId],
      users,
      tokens,
      vaults,
    },
  };
};
