import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { NETWORKS } from "../constants/networks";
import MarketplaceTable from "./MarketplaceTable";
import { formatCurrency } from "../utils/formatters";

function MarketplaceSummary({
  allStakesByChain,
  selectedChain,
  setSelectedChain,
}) {
  return (
    <div className="mb-8">
      <div className="overflow-x-auto bg-blue-50 dark:bg-gray-900 rounded-xl shadow-md p-4 border border-blue-200 dark:border-gray-700">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-blue-800 dark:text-blue-200 text-sm">
                Chain
              </th>
              <th className="px-4 py-2 text-right font-semibold text-blue-800 dark:text-blue-200 text-sm">
                Total Stakes
              </th>
              <th className="px-4 py-2 text-right font-semibold text-blue-800 dark:text-blue-200 text-sm">
                Total Value
              </th>
              <th className="px-4 py-2 text-right font-semibold text-blue-800 dark:text-blue-200 text-sm">
                Avg. Price
              </th>
              <th className="px-4 py-2 text-right font-semibold text-blue-800 dark:text-blue-200 text-sm">
                Price Range
              </th>
              <th className="px-4 py-2 text-right font-semibold text-blue-800 dark:text-blue-200 text-sm">
                Daily % Range
              </th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(NETWORKS).map((chainId) => {
              const stakes = allStakesByChain[chainId] || [];
              const decimals = NETWORKS[chainId].decimals;
              const totalNet = stakes.reduce((sum, s) => {
                const net = BigInt(s.amount || 0) + BigInt(s.bonusAmount || 0);
                return (
                  sum + Number(ethers.formatUnits(net.toString(), decimals))
                );
              }, 0);
              const prices = stakes.map((s) =>
                Number(ethers.formatUnits(s.price || 0, decimals))
              );
              const avgPrice = prices.length
                ? prices.reduce((a, b) => a + b, 0) / prices.length
                : 0;
              const minPrice = prices.length ? Math.min(...prices) : 0;
              const maxPrice = prices.length ? Math.max(...prices) : 0;
              const dailyRates = stakes.map(
                (s) => Number(s.dailyRewardRate) / 100
              );
              const minDaily = dailyRates.length ? Math.min(...dailyRates) : 0;
              const maxDaily = dailyRates.length ? Math.max(...dailyRates) : 0;
              const isSelected = selectedChain === chainId;
              return (
                <tr
                  key={chainId}
                  className="hover:bg-blue-100/60 dark:hover:bg-gray-800 transition"
                >
                  <td className="px-4 py-2 font-semibold text-blue-700 dark:text-blue-300 text-sm">
                    <button
                      className={`inline-block rounded px-2 py-1 transition font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-600 ${
                        isSelected
                          ? "bg-blue-600 text-white dark:bg-blue-400 dark:text-gray-900 shadow"
                          : "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800"
                      }`}
                      onClick={() => setSelectedChain(chainId)}
                    >
                      {NETWORKS[chainId].name}
                    </button>
                  </td>
                  <td className="px-4 py-2 text-right text-gray-700 dark:text-gray-200 text-sm">
                    {stakes.length}
                  </td>
                  <td className="px-4 py-2 text-right font-bold text-green-700 dark:text-green-300 text-base">
                    {formatCurrency(totalNet)}
                  </td>
                  <td className="px-4 py-2 text-right text-gray-700 dark:text-gray-200 text-sm">
                    {formatCurrency(avgPrice)}
                  </td>
                  <td className="px-4 py-2 text-right text-gray-700 dark:text-gray-200 text-sm">
                    {formatCurrency(minPrice)} - {formatCurrency(maxPrice)}
                  </td>
                  <td className="px-4 py-2 text-right text-gray-700 dark:text-gray-200 text-sm">
                    {minDaily.toFixed(2)}% - {maxDaily.toFixed(2)}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function Marketplace() {
  const [selectedChain, setSelectedChain] = useState("bsc");
  const [stakes, setStakes] = useState([]);
  const [allStakesByChain, setAllStakesByChain] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function fetchMarketplaceStakes() {
      setLoading(true);
      setError("");
      setStakes([]);
      try {
        const allStakes = {};
        // Fetch for all chains in parallel
        await Promise.all(
          Object.keys(NETWORKS).map(async (chainId) => {
            const { rpc, contract, abi } = NETWORKS[chainId];
            const provider = new ethers.JsonRpcProvider(rpc);
            const marketplace = new ethers.Contract(contract, abi, provider);
            const [sellers, stakeIds, sellStakeData, pendingRewards] =
              await marketplace.getAllSellStakesWithKeys();
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
            allStakes[chainId] = mapped;
            // If this is the selected chain, update the visible table
            if (chainId === selectedChain && !cancelled) {
              setStakes(mapped);
            }
          })
        );
        if (!cancelled) setAllStakesByChain(allStakes);
      } catch (err) {
        setError("Failed to load marketplace stakes.");
        setStakes([]);
        setAllStakesByChain({});
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
    // Only refetch if selectedChain changes (to update visible table)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChain]);

  return (
    <div className="w-full min-h-screen max-w-6xl mx-auto p-2 sm:p-4 md:p-6 bg-white dark:bg-gray-800 shadow rounded flex flex-col">
      <MarketplaceSummary
        allStakesByChain={allStakesByChain}
        selectedChain={selectedChain}
        setSelectedChain={setSelectedChain}
      />
      <div className="flex justify-between items-center mb-6" />
      {loading ? (
        <div className="text-center text-gray-500 dark:text-gray-400 py-8">
          Loading marketplace stakes...
        </div>
      ) : error ? (
        <div className="text-center text-red-500 dark:text-red-400 py-8">
          {error}
        </div>
      ) : (
        <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow">
          <MarketplaceTable chainId={selectedChain} stakes={stakes} />
        </div>
      )}
    </div>
  );
}
