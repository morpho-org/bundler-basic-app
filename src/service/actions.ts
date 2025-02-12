// src/service/actions.ts
import {
  addresses,
  ChainId,
  MarketId,
  DEFAULT_SLIPPAGE_TOLERANCE,
} from "@morpho-org/blue-sdk";
import "@morpho-org/blue-sdk-viem/lib/augment";
import { SimulationState } from "@morpho-org/simulation-sdk";

import { setupBundle } from "./helpers.js";
import { WalletClient } from "viem";

const { morpho } = addresses[ChainId.EthMainnet];

/**
 * Executes a series of Morpho Blue operations: supply, supply collateral, and borrow
 * @param marketId - The ID of the market to interact with
 * @param client - The wallet client instance
 * @param simulationState - The current simulation state
 * @param amountSupply - Amount to supply as lending position
 * @param amountSupplyCollateral - Amount to supply as collateral
 * @param amountBorrow - Amount to borrow
 * @returns Array of transaction responses
 */
export const supplySupplyCollateralBorrow = async (
  marketId: MarketId,
  client: WalletClient,
  simulationState: SimulationState,
  amountSupply: bigint,
  amountSupplyCollateral: bigint,
  amountBorrow: bigint
) => {
  const user = client.account?.address;
  if (!user) throw new Error("User address is required");
  return setupBundle(client, simulationState, [
    {
      type: "Blue_Supply",
      sender: user,
      address: morpho,
      args: {
        id: marketId,
        assets: amountSupply,
        onBehalf: user,
        slippage: DEFAULT_SLIPPAGE_TOLERANCE,
      },
    },
    {
      type: "Blue_SupplyCollateral",
      sender: user,
      address: morpho,
      args: {
        id: marketId,
        assets: amountSupplyCollateral,
        onBehalf: user,
      },
    },
    {
      type: "Blue_Borrow",
      sender: user,
      address: morpho,
      args: {
        id: marketId,
        assets: amountBorrow,
        onBehalf: user,
        receiver: user,
        slippage: DEFAULT_SLIPPAGE_TOLERANCE,
      },
    },
  ]);
};

/**
 * Executes a series of Morpho Blue operations: repay, withdraw collateral, and withdraw
 * @param marketId - The ID of the market to interact with
 * @param client - The wallet client instance
 * @param simulationState - The current simulation state
 * @param amountToRepay - Amount to repay
 * @param amountToWithdrawCollateral - Amount to withdraw collateral
 * @param amountToWithdraw - Amount to withdraw
 * @returns Array of transaction responses
 */
export const repayWithdrawCollateralWithdraw = async (
  marketId: MarketId,
  client: WalletClient,
  simulationState: SimulationState,
  amountToRepay: bigint,
  amountToWithdrawCollateral: bigint,
  amountToWithdraw: bigint
) => {
  const user = client.account?.address;
  if (!user) throw new Error("User address is required");
  return setupBundle(client, simulationState, [
    {
      type: "Blue_Repay",
      sender: user,
      address: morpho,
      args: {
        id: marketId,
        assets: amountToRepay,
        onBehalf: user,
        slippage: DEFAULT_SLIPPAGE_TOLERANCE,
      },
    },
    {
      type: "Blue_WithdrawCollateral",
      sender: user,
      address: morpho,
      args: {
        id: marketId,
        assets: amountToWithdrawCollateral,
        onBehalf: user,
        receiver: user,
      },
    },
    {
      type: "Blue_Withdraw",
      sender: user,
      address: morpho,
      args: {
        id: marketId,
        assets: amountToWithdraw,
        onBehalf: user,
        receiver: user,
        slippage: DEFAULT_SLIPPAGE_TOLERANCE,
      },
    },
  ]);
};
