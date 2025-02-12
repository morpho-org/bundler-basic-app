// src/App.tsx
import {
  getDefaultConfig,
  RainbowKitProvider,
  ConnectButton,
} from "@rainbow-me/rainbowkit";
import { useWalletClient, WagmiProvider } from "wagmi";
import { mainnet, anvil } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http } from "wagmi";
import { useState } from "react";
import {
  repayWithdrawCollateralWithdraw,
  supplySupplyCollateralBorrow,
} from "./service/actions";
import { MarketId } from "@morpho-org/blue-sdk";
import { parseEther } from "viem";
import {
  metaMaskWallet,
  okxWallet,
  rabbyWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { usePopulatedSimulationState } from "./hooks/usePopulatedSimulationState";
import "@rainbow-me/rainbowkit/styles.css";
import { useUserPosition } from "./hooks/useUserPosition";

const TestInterface = () => {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [inputs, setInputs] = useState({
    marketId:
      "0x39d11026eae1c6ec02aa4c0910778664089cdd97c3fd23f68f7cd05e2e95af48",
    supplyAmount: "1",
    supplyCollateralAmount: "5",
    borrowAmount: "1",
    repayAmount: "1",
    withdrawCollateralAmount: "5",
    withdrawAmount: "1",
  });

  const client = useWalletClient();

  const {
    simulationState,
    isPending: simulationIsPending,
    error: simulationError,
  } = usePopulatedSimulationState(inputs.marketId as MarketId);

  const {
    position,
    isLoading: positionLoading,
    error: positionError,
  } = useUserPosition(inputs.marketId as MarketId);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInputs((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const runTest = async () => {
    // Clear previous results first
    setTestResults([]);

    if (!client.data || !client.data.account) {
      setTestResults(["Please connect your wallet first"]);
      return;
    }

    if (simulationIsPending || !simulationState) {
      setTestResults((prev) => [
        ...prev,
        "Simulation state is still loading, please try again shortly.",
      ]);
      return;
    }

    if (simulationError) {
      setTestResults((prev) => [
        ...prev,
        `Error loading simulation state: ${simulationError}`,
      ]);
      return;
    }

    try {
      // Convert input values to BigInt using parseEther.
      const supplyAmountWei = parseEther(inputs.supplyAmount);
      const supplyCollateralAmountWei = parseEther(
        inputs.supplyCollateralAmount
      );
      const borrowAmountWei = parseEther(inputs.borrowAmount);

      // Use the populated simulationState directly
      await supplySupplyCollateralBorrow(
        inputs.marketId as MarketId,
        client.data,
        simulationState,
        supplyAmountWei,
        supplyCollateralAmountWei,
        borrowAmountWei
      );

      setTestResults((prev) => [
        ...prev,
        "Bundler action executed successfully",
      ]);
    } catch (error: unknown) {
      console.error("Error during bundler action:", error);
      setTestResults((prev) => [
        ...prev,
        `Error: ${error instanceof Error ? error.message : String(error)}`,
      ]);
    }
  };

  const runRepayWithdraw = async () => {
    // Clear previous results first
    setTestResults([]);

    if (!client.data || !client.data.account) {
      setTestResults(["Please connect your wallet first"]);
      return;
    }

    if (simulationIsPending || !simulationState) {
      setTestResults((prev) => [
        ...prev,
        "Simulation state is still loading, please try again shortly.",
      ]);
      return;
    }

    if (simulationError) {
      setTestResults((prev) => [
        ...prev,
        `Error loading simulation state: ${simulationError}`,
      ]);
      return;
    }

    try {
      const repayAmountWei = parseEther(inputs.repayAmount);
      const withdrawCollateralAmountWei = parseEther(
        inputs.withdrawCollateralAmount
      );
      const withdrawAmountWei = parseEther(inputs.withdrawAmount);

      await repayWithdrawCollateralWithdraw(
        inputs.marketId as MarketId,
        client.data,
        simulationState,
        repayAmountWei,
        withdrawCollateralAmountWei,
        withdrawAmountWei
      );

      setTestResults((prev) => [
        ...prev,
        "Repay/Withdraw bundler action executed successfully",
      ]);
    } catch (error: unknown) {
      console.error("Error during bundler action:", error);
      setTestResults((prev) => [
        ...prev,
        `Error: ${error instanceof Error ? error.message : String(error)}`,
      ]);
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] text-gray-200 p-8">
      <div className="max-w-[1400px] mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">
            Bundler Dumb Interface
          </h1>
          <div>
            <ConnectButton />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6 mb-8">
          {/* Column 1: Market ID and Position */}
          <div className="space-y-6">
            <div className="bg-[#1E1E1E] rounded-lg p-6 border-[1.5px] border-gray-700">
              <h2 className="text-xl font-semibold mb-6 flex items-center">
                <span className="mr-2">▲</span> Market Parameters
              </h2>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Market ID
                </label>
                <input
                  type="text"
                  name="marketId"
                  value={inputs.marketId}
                  onChange={handleInputChange}
                  className="w-full bg-[#121212] border-[0.5px] border-gray-300 rounded p-2 text-sm"
                />
              </div>
            </div>

            {/* Position Information */}
            <div className="bg-[#1E1E1E] rounded-lg p-6 border-[1.5px] border-gray-700">
              <h2 className="text-xl font-semibold mb-6 flex items-center">
                <span className="mr-2">▲</span> Current Position
              </h2>
              {!client.data?.account ? (
                <div className="text-gray-500 text-sm">
                  Please connect your wallet
                </div>
              ) : positionLoading ? (
                <div className="text-gray-500 text-sm">Loading position...</div>
              ) : positionError ? (
                <div className="text-red-500 text-sm">{positionError}</div>
              ) : position ? (
                <div className="space-y-4">
                  <div className="bg-[#121212] border border-gray-700 rounded-md p-3">
                    <div className="text-sm mb-2">
                      <span className="text-gray-400">Supply Assets:</span>{" "}
                      {position.supplyAssets.toString()}
                    </div>
                    <div className="text-sm mb-2">
                      <span className="text-gray-400">Collateral Assets:</span>{" "}
                      {position.collateralAssets.toString()}
                    </div>
                    <div className="text-sm mb-2">
                      <span className="text-gray-400">Borrow Assets:</span>{" "}
                      {position.borrowAssets.toString()}
                    </div>
                    <div className="text-sm mb-2">
                      <span className="text-gray-400">Max Borrowable:</span>{" "}
                      {position.maxBorrowableAssets?.toString()}
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-400">Health:</span>{" "}
                      <span
                        className={
                          position.isHealthy ? "text-green-500" : "text-red-500"
                        }
                      >
                        {position.isHealthy ? "Healthy" : "Unhealthy"}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-gray-500 text-sm">
                  No position data available
                </div>
              )}
            </div>
          </div>

          {/* Column 2: Supply Section */}
          <div className="bg-[#1E1E1E] rounded-lg p-6 border-[1.5px] border-gray-700">
            <h2 className="text-xl font-semibold mb-6">
              Supply & Supply Collateral + Borrow
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">
                  Supply Amount (native units)
                </label>
                <input
                  type="text"
                  name="supplyAmount"
                  value={inputs.supplyAmount}
                  onChange={handleInputChange}
                  className="w-full bg-[#121212] border-[0.5px] border-gray-300 rounded p-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">
                  Supply Collateral Amount (native units)
                </label>
                <input
                  type="text"
                  name="supplyCollateralAmount"
                  value={inputs.supplyCollateralAmount}
                  onChange={handleInputChange}
                  className="w-full bg-[#121212] border-[0.5px] border-gray-300 rounded p-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">
                  Borrow Amount (native units)
                </label>
                <input
                  type="text"
                  name="borrowAmount"
                  value={inputs.borrowAmount}
                  onChange={handleInputChange}
                  className="w-full bg-[#121212] border-[0.5px] border-gray-300 rounded p-2.5 text-sm"
                />
              </div>

              <button
                onClick={runTest}
                className="w-full !bg-blue-500 hover:bg-[#0045CC] text-white py-3 rounded-md font-medium mt-6 transition-colors"
              >
                Execute in one tx
              </button>
            </div>
          </div>

          {/* Column 3: Repay Section */}
          <div className="bg-[#1E1E1E] rounded-lg p-6 border-[1.5px] border-gray-700">
            <h2 className="text-xl font-semibold mb-6">
              Repay & Withdraw Collateral & Withdraw
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">
                  Repay Amount (native units)
                </label>
                <input
                  type="text"
                  name="repayAmount"
                  value={inputs.repayAmount}
                  onChange={handleInputChange}
                  className="w-full bg-[#121212] border-[0.5px] border-gray-300 rounded p-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">
                  Withdraw Collateral Amount (native units)
                </label>
                <input
                  type="text"
                  name="withdrawCollateralAmount"
                  value={inputs.withdrawCollateralAmount}
                  onChange={handleInputChange}
                  className="w-full bg-[#121212] border-[0.5px] border-gray-300 rounded p-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">
                  Withdraw Amount (native units)
                </label>
                <input
                  type="text"
                  name="withdrawAmount"
                  value={inputs.withdrawAmount}
                  onChange={handleInputChange}
                  className="w-full bg-[#121212] border-[0.5px] border-gray-300 rounded p-2.5 text-sm"
                />
              </div>

              <button
                onClick={runRepayWithdraw}
                className="w-full !bg-red-500 hover:bg-red-600 text-white py-3 rounded-md font-medium mt-6 transition-colors"
              >
                Execute in one tx
              </button>
            </div>
          </div>
        </div>

        {/* Results Section - Moved below the grid */}
        <div className="bg-[#1E1E1E] rounded-lg p-6 border-[1.5px] border-gray-700">
          <h2 className="text-xl font-semibold mb-4">Test Results</h2>
          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {testResults.length > 0 ? (
              testResults.map((result, index) => (
                <div
                  key={index}
                  className="bg-[#121212] border border-gray-700 rounded-md p-2 text-sm"
                >
                  {result}
                </div>
              ))
            ) : (
              <div className="text-gray-500 text-sm">
                No results to display yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Configuration for your app (Wagmi, RainbowKit, React Query, etc.)
const config = getDefaultConfig({
  appName: "Test Wagmi Interface",
  projectId: "841b6ddde2826ce0acf2d1b1f81f8582",
  chains: [mainnet, anvil],
  wallets: [
    {
      groupName: "Popular",
      wallets: [metaMaskWallet, rabbyWallet, okxWallet],
    },
  ],
  transports: {
    [mainnet.id]: http(),
    [anvil.id]: http("http://127.0.0.1:8545"),
  },
});

const queryClient = new QueryClient();

// Main App component
function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <TestInterface />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;
