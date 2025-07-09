import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { NETWORKS } from "../constants/networks";
import MarketplaceTable from "./MarketplaceTable";

export default function Marketplace() {
  const [selectedChain, setSelectedChain] = useState("bsc");
  const [stakes, setStakes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function fetchMarketplaceStakes() {
      setLoading(true);
      setError("");
      setStakes([]);
      try {
        const { rpc, contract, abi } = NETWORKS[selectedChain];
        const provider = new ethers.JsonRpcProvider(rpc);
        const marketplace = new ethers.Contract(contract, abi, provider);
        const [sellers, stakeIds, sellStakeData, pendingRewards] =
          await marketplace.getAllSellStakesWithKeys();
        if (cancelled) return;
        const mapped = sellStakeData.map((stake, i) => ({
          seller: sellers[i],
          stakeId: stakeIds[i]?.toString(),
          price: stake.price?.toString(),
          bonusAmount: stake.bonusAmount?.toString(),
          amount: stake.amount?.toString(),
          lastClaimed: stake.lastClaimed?.toString(),
          dailyRewardRate: stake.dailyRewardRate?.toString(),
          origUnlockTime: stake.origUnlockTime?.toString(),
          pendingRewards: pendingRewards[i]?.toString(),
        }));
        setStakes(mapped);
      } catch (err) {
        setError("Failed to load marketplace stakes.");
        setStakes([]);
        // eslint-disable-next-line no-console
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchMarketplaceStakes();
    return () => {
      cancelled = true;
    };
  }, [selectedChain]);

  return (
    <div className="w-full max-w-6xl mx-auto p-2 sm:p-4 md:p-6 bg-white dark:bg-gray-800 shadow rounded">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-center">Marketplace</h1>
      </div>
      <div className="mb-6 flex gap-2">
        {Object.keys(NETWORKS).map((chainId) => (
          <button
            key={chainId}
            onClick={() => setSelectedChain(chainId)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${
              selectedChain === chainId
                ? "bg-blue-600 dark:bg-blue-500 text-white shadow-md"
                : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
            }`}
          >
            {NETWORKS[chainId].name}
          </button>
        ))}
      </div>
      {loading ? (
        <div className="text-center text-gray-500 dark:text-gray-400 py-8">
          Loading marketplace stakes...
        </div>
      ) : error ? (
        <div className="text-center text-red-500 dark:text-red-400 py-8">
          {error}
        </div>
      ) : (
        <MarketplaceTable chainId={selectedChain} stakes={stakes} />
      )}
    </div>
  );
}
