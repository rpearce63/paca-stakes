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
    <div className="overflow-x-auto bg-white/90 dark:bg-gray-900 rounded-lg shadow-lg border border-blue-200 p-4 mb-6">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="px-2 sm:px-4 py-1 sm:py-2 text-left font-semibold text-blue-800 dark:text-blue-200 text-xs sm:text-sm">
              Chain
            </th>
            <th className="px-2 sm:px-4 py-1 sm:py-2 text-right font-semibold text-blue-800 dark:text-blue-200 text-xs sm:text-sm">
              Total Stakes
            </th>
            <th className="px-2 sm:px-4 py-1 sm:py-2 text-right font-semibold text-blue-800 dark:text-blue-200 text-xs sm:text-sm">
              Total Value
            </th>
            <th className="px-2 sm:px-4 py-1 sm:py-2 text-right font-semibold text-blue-800 dark:text-blue-200 text-xs sm:text-sm">
              Avg. Price
            </th>
            <th className="px-2 sm:px-4 py-1 sm:py-2 text-right font-semibold text-blue-800 dark:text-blue-200 text-xs sm:text-sm">
              Price Range
            </th>
            <th className="px-2 sm:px-4 py-1 sm:py-2 text-right font-semibold text-blue-800 dark:text-blue-200 text-xs sm:text-sm">
              Daily % Range
            </th>
          </tr>
        </thead>
        <tbody>
          {Object.keys(NETWORKS)
            .filter((chainId) => chainId !== "sonic") // Hide Sonic for now
            .map((chainId, idx) => {
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
                  className={
                    idx % 2 === 0
                      ? "bg-white dark:bg-gray-900"
                      : "bg-blue-50 dark:bg-gray-800"
                  }
                >
                  <td className="px-2 sm:px-4 py-1 sm:py-2 font-semibold text-blue-700 dark:text-blue-300 text-xs sm:text-sm">
                    <button
                      className={`inline-block rounded px-1 sm:px-2 py-0.5 sm:py-1 transition font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-600 text-xs sm:text-sm ${
                        isSelected
                          ? "bg-blue-600 text-white dark:bg-blue-400 dark:text-gray-900 shadow"
                          : "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800"
                      }`}
                      onClick={() => setSelectedChain(chainId)}
                    >
                      {NETWORKS[chainId].name}
                    </button>
                  </td>
                  <td className="px-2 sm:px-4 py-1 sm:py-2 text-right text-gray-700 dark:text-gray-200 text-xs sm:text-sm">
                    {stakes.length}
                  </td>
                  <td className="px-2 sm:px-4 py-1 sm:py-2 text-right font-bold text-green-700 dark:text-green-300 text-xs sm:text-base">
                    {formatCurrency(totalNet)}
                  </td>
                  <td className="px-2 sm:px-4 py-1 sm:py-2 text-right text-gray-700 dark:text-gray-200 text-xs sm:text-sm">
                    {formatCurrency(avgPrice)}
                  </td>
                  <td className="px-2 sm:px-4 py-1 sm:py-2 text-right text-gray-700 dark:text-gray-200 text-xs sm:text-sm">
                    {formatCurrency(minPrice)} - {formatCurrency(maxPrice)}
                  </td>
                  <td className="px-2 sm:px-4 py-1 sm:py-2 text-right text-gray-700 dark:text-gray-200 text-xs sm:text-sm">
                    {minDaily.toFixed(2)}% - {maxDaily.toFixed(2)}%
                  </td>
                </tr>
              );
            })}
        </tbody>
      </table>
    </div>
  );
}

export default function Marketplace() {
  // Hide Sonic for now
  const [selectedChain, setSelectedChain] = useState("bsc");
  const [stakes, setStakes] = useState([]);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const totalPages = Math.max(1, Math.ceil(stakes.length / rowsPerPage));
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
        // Fetch for all chains in parallel, but skip Sonic
        await Promise.all(
          Object.keys(NETWORKS)
            .filter((chainId) => chainId !== "sonic")
            .map(async (chainId) => {
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
                setPage(1); // Reset to first page on chain change
              }
            })
        );
        if (!cancelled) setAllStakesByChain(allStakes);
      } catch {
        setError("Failed to load marketplace stakes.");
        setStakes([]);
        setAllStakesByChain({});
        // console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchMarketplaceStakes();
    return () => {
      cancelled = true;
    };
    // Only refetch if selectedChain changes (to update visible table)
  }, [selectedChain]);

  // Poll for new data every minute
  useEffect(() => {
    let cancelled = false;
    const interval = setInterval(() => {
      if (!cancelled) {
        (async () => {
          try {
            const allStakes = {};
            await Promise.all(
              Object.keys(NETWORKS)
                .filter((chainId) => chainId !== "sonic")
                .map(async (chainId) => {
                  const { rpc, contract, abi } = NETWORKS[chainId];
                  const provider = new ethers.JsonRpcProvider(rpc);
                  const marketplace = new ethers.Contract(
                    contract,
                    abi,
                    provider
                  );
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
                  if (chainId === selectedChain && !cancelled) {
                    setStakes(mapped);
                    setPage(1); // Reset to first page on update
                  }
                })
            );
            if (!cancelled) setAllStakesByChain(allStakes);
          } catch {
            // console.error("Polling error:", err);
          }
        })();
      }
    }, 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [selectedChain]);

  // Reset to page 1 if stakes or selectedChain changes
  useEffect(() => {
    setPage(1);
  }, [stakes, selectedChain, rowsPerPage]);

  return (
    <div className="relative w-full min-h-screen max-w-7xl mx-auto p-2 sm:p-4 md:p-6 bg-gray-50 dark:bg-gray-800 shadow rounded flex flex-col overflow-hidden">
      <div className="relative z-10">
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
          <div className="overflow-x-auto bg-white/90 dark:bg-gray-800 rounded-lg shadow-lg border border-blue-200 p-4">
            <MarketplaceTable chainId={selectedChain} stakes={stakes} />
          </div>
        )}
        {/* Pagination controls */}
        {stakes.length > 10 && (
          <div className="flex flex-row flex-nowrap justify-between items-center gap-2 mt-4 w-full overflow-x-auto">
            <div className="flex items-center gap-2 flex-shrink-0">
              <label
                htmlFor="marketplace-rows-per-page"
                className="text-sm dark:text-white"
              >
                Rows per page:
              </label>
              <select
                id="marketplace-rows-per-page"
                className="border border-blue-300 rounded px-2 py-1 text-sm bg-blue-50 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-300"
                value={rowsPerPage}
                onChange={(e) => setRowsPerPage(Number(e.target.value))}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
              <button
                className="px-2 py-1 rounded bg-blue-100 hover:bg-blue-200 text-blue-700 font-semibold border border-blue-200 dark:bg-gray-700 dark:text-gray-200 disabled:opacity-50"
                onClick={() => setPage(1)}
                disabled={page === 1}
                aria-label="First page"
              >
                {"|<"}
              </button>
              <button
                className="px-2 py-1 rounded bg-blue-100 hover:bg-blue-200 text-blue-700 font-semibold border border-blue-200 dark:bg-gray-700 dark:text-gray-200 disabled:opacity-50"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                aria-label="Previous page"
              >
                {"<"}
              </button>
              <span className="text-sm dark:text-white">
                Page {page} of {totalPages}
              </span>
              <button
                className="px-2 py-1 rounded bg-blue-100 hover:bg-blue-200 text-blue-700 font-semibold border border-blue-200 dark:bg-gray-700 dark:text-gray-200 disabled:opacity-50"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                aria-label="Next page"
              >
                {">"}
              </button>
              <button
                className="px-2 py-1 rounded bg-blue-100 hover:bg-blue-200 text-blue-700 font-semibold border border-blue-200 dark:bg-gray-700 dark:text-gray-200 disabled:opacity-50"
                onClick={() => setPage(totalPages)}
                disabled={page === totalPages}
                aria-label="Last page"
              >
                {">|"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
