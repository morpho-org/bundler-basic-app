import { useEffect, useState } from "react";
import { MarketId } from "@morpho-org/blue-sdk";

import { useWalletClient } from "wagmi";
import "@morpho-org/blue-sdk-viem/lib/augment/Position";
import { AccrualPosition } from "@morpho-org/blue-sdk";

interface EnhancedPosition {
  supplyAssets: bigint;
  borrowAssets: bigint;
  collateralAssets: bigint;
  maxBorrowableAssets: bigint | undefined;
  isHealthy: boolean | undefined;
  ltv: bigint | null | undefined;
  healthFactor: bigint | null | undefined;
  borrowCapacityUsage: bigint | undefined;
  liquidationPrice: bigint | null;
}

export function useUserPosition(marketId: MarketId) {
  const [position, setPosition] = useState<EnhancedPosition | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const client = useWalletClient();

  useEffect(() => {
    if (!client.data?.account) return;

    const fetchPosition = async () => {
      try {
        const userPosition = await AccrualPosition.fetch(
          client.data.account.address,
          marketId,
          client.data
        );

        setPosition({
          supplyAssets: userPosition.supplyAssets,
          borrowAssets: userPosition.borrowAssets,
          collateralAssets: userPosition.collateral,
          maxBorrowableAssets: userPosition.maxBorrowableAssets,
          isHealthy: userPosition.isHealthy,
          ltv: userPosition.ltv,
          healthFactor: userPosition.healthFactor,
          borrowCapacityUsage: userPosition.borrowCapacityUsage,
          liquidationPrice: userPosition.liquidationPrice,
        });
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch position"
        );
        setPosition(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPosition();
    const interval = setInterval(fetchPosition, 5000);

    return () => clearInterval(interval);
  }, [client.data, marketId]);

  return { position, isLoading, error };
}
