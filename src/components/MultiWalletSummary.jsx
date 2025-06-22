import React, { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { NETWORKS } from "../constants/networks";
import { formatCurrency } from "../utils/formatters";
import { sortData, getSortIcon } from "../utils/sorting";

const MultiWalletSummary = ({
  addressList,
  onAddressClick,
  onBackToSingle,
}) => {
  const [addressData, setAddressData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState("compact"); // "expanded" or "compact"
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  const fetchAddressData = useCallback(async (address) => {
    if (!ethers.isAddress(address)) return null;

    try {
      const chainPromises = Object.keys(NETWORKS).map(async (chainId) => {
        try {
          const provider = new ethers.JsonRpcProvider(NETWORKS[chainId].rpc);
          const getStakesContract = new ethers.Contract(
            NETWORKS[chainId].contract,
            NETWORKS[chainId].abi,
            provider
          );

          const stakeData = await getStakesContract.getStakes(address);
          const rewardsData = await getStakesContract.viewRewards(address);

          const stakesWithIds = stakeData.map((stake, index) => {
            const amount = Number(
              ethers.formatUnits(stake.amount, NETWORKS[chainId].decimals)
            );
            const dailyRate = Number(stake.dailyRewardRate) / 100;
            const dailyEarnings = (amount * dailyRate) / 100;

            return {
              ...stake,
              id: index,
              amount: stake.amount.toString(),
              lastClaimed: stake.lastClaimed.toString(),
              unlockTime: stake.unlockTime.toString(),
              dailyRewardRate: stake.dailyRewardRate.toString(),
              dailyEarnings,
              complete: Boolean(stake.complete),
            };
          });

          const chainTotalStaked = stakesWithIds.reduce(
            (acc, s) =>
              acc +
              Number(ethers.formatUnits(s.amount, NETWORKS[chainId].decimals)),
            0
          );

          const chainDailyEarnings = stakesWithIds.reduce(
            (acc, s) => acc + s.dailyEarnings,
            0
          );

          return {
            chainId,
            totalStaked: chainTotalStaked,
            rewards: Number(
              ethers.formatUnits(rewardsData, NETWORKS[chainId].decimals)
            ),
            dailyEarnings: chainDailyEarnings,
          };
        } catch (error) {
          console.error(
            `Error fetching ${chainId} data for ${address}:`,
            error
          );
          return {
            chainId,
            totalStaked: 0,
            rewards: 0,
            dailyEarnings: 0,
          };
        }
      });

      const results = await Promise.all(chainPromises);
      const chainTotals = {};

      results.forEach((result) => {
        if (result) {
          chainTotals[result.chainId] = {
            totalStaked: result.totalStaked,
            rewards: result.rewards,
            dailyEarnings: result.dailyEarnings,
          };
        }
      });

      return chainTotals;
    } catch (error) {
      console.error(`Error fetching data for ${address}:`, error);
      return null;
    }
  }, []);

  const fetchAllAddressesData = useCallback(async () => {
    if (addressList.length === 0) return;

    setLoading(true);
    setError("");

    try {
      const addressPromises = addressList.map(async (address) => {
        const data = await fetchAddressData(address);
        return { address, data };
      });

      const results = await Promise.all(addressPromises);
      const newAddressData = {};

      results.forEach(({ address, data }) => {
        if (data) {
          newAddressData[address] = data;
        }
      });
      // console.log(newAddressData);
      setAddressData(newAddressData);
    } catch (error) {
      console.error("Error fetching multi-wallet data:", error);
      setError("Failed to fetch data for some addresses.");
    } finally {
      setLoading(false);
    }
  }, [addressList, fetchAddressData]);

  useEffect(() => {
    fetchAllAddressesData();
  }, [fetchAllAddressesData]);

  const shortenAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const getSortedCompactData = () => {
    const compactData = addressList
      .map((address) => {
        const addressChainData = addressData[address];
        if (!addressChainData) return null;

        const addressTotalStaked = Object.values(addressChainData).reduce(
          (acc, chain) => acc + chain.totalStaked,
          0
        );
        const addressTotalRewards = Object.values(addressChainData).reduce(
          (acc, chain) => acc + chain.rewards,
          0
        );
        const addressTotalDailyEarnings = Object.values(
          addressChainData
        ).reduce((acc, chain) => acc + chain.dailyEarnings, 0);

        // Calculate APR
        const dailyAPR =
          addressTotalStaked > 0
            ? (addressTotalDailyEarnings / addressTotalStaked) * 100
            : 0;
        const annualAPR = dailyAPR * 365;

        return {
          address,
          totalStaked: addressTotalStaked,
          rewards: addressTotalRewards,
          dailyEarnings: addressTotalDailyEarnings,
          dailyAPR,
          annualAPR,
        };
      })
      .filter(Boolean);

    if (sortConfig.key) {
      return sortData(compactData, sortConfig);
    }
    return compactData;
  };

  const calculateOverallTotals = () => {
    const overall = {};

    Object.keys(NETWORKS).forEach((chainId) => {
      overall[chainId] = {
        totalStaked: 0,
        rewards: 0,
        dailyEarnings: 0,
      };
    });

    Object.values(addressData).forEach((addressChainData) => {
      Object.keys(NETWORKS).forEach((chainId) => {
        if (addressChainData[chainId]) {
          overall[chainId].totalStaked += addressChainData[chainId].totalStaked;
          overall[chainId].rewards += addressChainData[chainId].rewards;
          overall[chainId].dailyEarnings +=
            addressChainData[chainId].dailyEarnings;
        }
      });
    });

    return overall;
  };

  const overallTotals = calculateOverallTotals();

  const totalStakedAcrossChains = Object.values(overallTotals).reduce(
    (acc, chain) => acc + chain.totalStaked,
    0
  );
  const totalRewardsAcrossChains = Object.values(overallTotals).reduce(
    (acc, chain) => acc + chain.rewards,
    0
  );
  const totalDailyEarningsAcrossChains = Object.values(overallTotals).reduce(
    (acc, chain) => acc + chain.dailyEarnings,
    0
  );

  if (loading) {
    return (
      <div className="w-full max-w-5xl mx-auto p-2 sm:p-4 md:p-6 bg-white dark:bg-gray-800 shadow rounded">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-center">
            Multi-Wallet Summary
          </h1>
          <button
            onClick={onBackToSingle}
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
          >
            Single Wallet
          </button>
        </div>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading wallet data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto p-2 sm:p-4 md:p-6 bg-white dark:bg-gray-800 shadow rounded">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-center">Multi-Wallet Summary</h1>
        <div className="flex gap-2">
          <button
            onClick={() =>
              setViewMode(viewMode === "expanded" ? "compact" : "expanded")
            }
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            {viewMode === "expanded" ? "Compact View" : "Expanded View"}
          </button>
          <button
            onClick={onBackToSingle}
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
          >
            Single Wallet
          </button>
        </div>
      </div>

      {error && <p className="text-red-600 mb-4 text-sm">{error}</p>}

      {/* Overall Summary Table */}
      <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <div className="flex items-center mb-4">
          <svg
            className="w-6 h-6 text-blue-600 dark:text-blue-400 mr-2"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-xl font-semibold dark:text-white">
            Overall Summary ({addressList.length} wallets)
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-blue-300 dark:border-blue-700 bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-lg">
            <thead>
              <tr className="bg-blue-100 dark:bg-blue-900/30">
                <th className="border border-blue-300 dark:border-blue-700 px-4 py-2 text-left font-semibold dark:text-white">
                  Chain
                </th>
                <th className="border border-blue-300 dark:border-blue-700 px-4 py-2 text-right font-semibold dark:text-white">
                  Total Staked
                </th>
                <th className="border border-blue-300 dark:border-blue-700 px-4 py-2 text-right font-semibold dark:text-white">
                  Claimable Funds
                </th>
                <th className="border border-blue-300 dark:border-blue-700 px-4 py-2 text-right font-semibold dark:text-white">
                  Daily Earnings
                </th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(overallTotals).map(([chain, data]) => (
                <tr
                  key={chain}
                  className="hover:bg-blue-50 dark:hover:bg-blue-900/10"
                >
                  <td className="border border-blue-300 dark:border-blue-700 px-4 py-2 font-medium dark:text-white">
                    {NETWORKS[chain].name} ({NETWORKS[chain].token})
                  </td>
                  <td className="border border-blue-300 dark:border-blue-700 px-4 py-2 text-right dark:text-white">
                    {formatCurrency(data.totalStaked)}
                  </td>
                  <td className="border border-blue-300 dark:border-blue-700 px-4 py-2 text-right dark:text-white">
                    {formatCurrency(data.rewards)}
                  </td>
                  <td className="border border-blue-300 dark:border-blue-700 px-4 py-2 text-right dark:text-white">
                    {formatCurrency(data.dailyEarnings)}
                  </td>
                </tr>
              ))}
              <tr className="bg-blue-200 dark:bg-blue-800/50 font-semibold">
                <td className="border border-blue-300 dark:border-blue-700 px-4 py-2 dark:text-white">
                  TOTAL
                </td>
                <td className="border border-blue-300 dark:border-blue-700 px-4 py-2 text-right dark:text-white">
                  {formatCurrency(totalStakedAcrossChains)}
                </td>
                <td className="border border-blue-300 dark:border-blue-700 px-4 py-2 text-right dark:text-white">
                  {formatCurrency(totalRewardsAcrossChains)}
                </td>
                <td className="border border-blue-300 dark:border-blue-700 px-4 py-2 text-right dark:text-white">
                  {formatCurrency(totalDailyEarningsAcrossChains)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Visual Separator */}
      <div className="mb-8 flex items-center">
        <div className="flex-1 border-t border-gray-300 dark:border-gray-600"></div>
        <div className="px-4 text-gray-500 dark:text-gray-400 text-sm font-medium">
          Individual Wallets
        </div>
        <div className="flex-1 border-t border-gray-300 dark:border-gray-600"></div>
      </div>

      {/* Compact View */}
      {viewMode === "compact" && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-700">
                <th
                  className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left font-semibold dark:text-white cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600"
                  onClick={() => requestSort("address")}
                >
                  <div className="flex items-center">
                    Address
                    {getSortIcon(sortConfig, "address")}
                  </div>
                </th>
                <th
                  className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-right font-semibold dark:text-white cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600"
                  onClick={() => requestSort("totalStaked")}
                >
                  <div className="flex items-center justify-end">
                    Total Staked
                    {getSortIcon(sortConfig, "totalStaked")}
                  </div>
                </th>
                <th
                  className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-right font-semibold dark:text-white cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600"
                  onClick={() => requestSort("rewards")}
                >
                  <div className="flex items-center justify-end">
                    Claimable Funds
                    {getSortIcon(sortConfig, "rewards")}
                  </div>
                </th>
                <th
                  className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-right font-semibold dark:text-white cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600"
                  onClick={() => requestSort("dailyEarnings")}
                >
                  <div className="flex items-center justify-end">
                    Daily Earnings
                    {getSortIcon(sortConfig, "dailyEarnings")}
                  </div>
                </th>
                <th
                  className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-right font-semibold dark:text-white cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600"
                  onClick={() => requestSort("dailyAPR")}
                >
                  <div className="flex items-center justify-end">
                    Daily %{getSortIcon(sortConfig, "dailyAPR")}
                  </div>
                </th>
                <th
                  className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-right font-semibold dark:text-white cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600"
                  onClick={() => requestSort("annualAPR")}
                >
                  <div className="flex items-center justify-end">
                    Annual %{getSortIcon(sortConfig, "annualAPR")}
                  </div>
                </th>
                <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center font-semibold dark:text-white">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {getSortedCompactData().map((data) => (
                <tr
                  key={data.address}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 font-medium dark:text-white">
                    {shortenAddress(data.address)}
                  </td>
                  <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-right dark:text-white">
                    {formatCurrency(data.totalStaked)}
                  </td>
                  <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-right dark:text-white">
                    {formatCurrency(data.rewards)}
                  </td>
                  <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-right dark:text-white">
                    {formatCurrency(data.dailyEarnings)}
                  </td>
                  <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-right dark:text-white">
                    {data.dailyAPR.toFixed(2)}%
                  </td>
                  <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-right dark:text-white">
                    {data.annualAPR.toFixed(2)}%
                  </td>
                  <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center">
                    <button
                      onClick={() => onAddressClick(data.address)}
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Expanded View */}
      {viewMode === "expanded" && (
        <>
          {addressList.map((address) => {
            const addressChainData = addressData[address];
            if (!addressChainData) return null;

            const addressTotalStaked = Object.values(addressChainData).reduce(
              (acc, chain) => acc + chain.totalStaked,
              0
            );
            const addressTotalRewards = Object.values(addressChainData).reduce(
              (acc, chain) => acc + chain.rewards,
              0
            );
            const addressTotalDailyEarnings = Object.values(
              addressChainData
            ).reduce((acc, chain) => acc + chain.dailyEarnings, 0);

            return (
              <div key={address} className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold dark:text-white">
                    {shortenAddress(address)}
                  </h3>
                  <button
                    onClick={() => onAddressClick(address)}
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
                  >
                    View Details
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow">
                    <thead>
                      <tr className="bg-gray-100 dark:bg-gray-700">
                        <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left font-semibold dark:text-white">
                          Chain
                        </th>
                        <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-right font-semibold dark:text-white">
                          Total Staked
                        </th>
                        <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-right font-semibold dark:text-white">
                          Claimable Funds
                        </th>
                        <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-right font-semibold dark:text-white">
                          Daily Earnings
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(addressChainData).map(([chain, data]) => (
                        <tr
                          key={chain}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 font-medium dark:text-white">
                            {NETWORKS[chain].name}
                          </td>
                          <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-right dark:text-white">
                            {formatCurrency(data.totalStaked)}
                          </td>
                          <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-right dark:text-white">
                            {formatCurrency(data.rewards)}
                          </td>
                          <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-right dark:text-white">
                            {formatCurrency(data.dailyEarnings)}
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-gray-50 dark:bg-gray-700 font-semibold">
                        <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 dark:text-white">
                          TOTAL
                        </td>
                        <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-right dark:text-white">
                          {formatCurrency(addressTotalStaked)}
                        </td>
                        <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-right dark:text-white">
                          {formatCurrency(addressTotalRewards)}
                        </td>
                        <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-right dark:text-white">
                          {formatCurrency(addressTotalDailyEarnings)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
};

export default MultiWalletSummary;
