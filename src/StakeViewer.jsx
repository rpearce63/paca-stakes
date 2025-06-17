import React, { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { ABI } from "./PacaABI";
const NETWORKS = {
  bsc: {
    name: "BSC",
    rpc: "https://bsc-dataseed.binance.org/",
    contract: "0x3fF44D639a4982A4436f6d737430141aBE68b4E1",
    token: "USDT",
    decimals: 18,
  },
  base: {
    name: "BASE",
    rpc: "https://mainnet.base.org",
    contract: "0xDf2027318D27c4eD1C047B4d6247A7a705bb407b",
    token: "USDC",
    decimals: 6,
  },
};

export default function StakeViewer() {
  const [address, setAddress] = useState("");
  const [stakes, setStakes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [network, setNetwork] = useState("bsc");
  const [chainTotals, setChainTotals] = useState({});
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [hideCompleted, setHideCompleted] = useState(false);

  const fetchChainData = useCallback(
    async (chainId) => {
      try {
        const provider = new ethers.JsonRpcProvider(NETWORKS[chainId].rpc);
        const contract = new ethers.Contract(
          NETWORKS[chainId].contract,
          ABI,
          provider
        );
        const stakeData = await contract.getStakes(address);
        const rewardsData = await contract.viewRewards(address);

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
          stakes: stakesWithIds,
          totalStaked: chainTotalStaked,
          rewards: Number(
            ethers.formatUnits(rewardsData, NETWORKS[chainId].decimals)
          ),
          dailyEarnings: chainDailyEarnings,
        };
      } catch (error) {
        console.error(`Error fetching ${chainId} data:`, error);
        return {
          stakes: [],
          totalStaked: 0,
          rewards: 0,
          dailyEarnings: 0,
        };
      }
    },
    [address]
  );

  const fetchAllChains = useCallback(async () => {
    if (!address) return;

    setLoading(true);
    setError("");

    try {
      // Fetch data from all chains in parallel
      const chainPromises = Object.keys(NETWORKS).map((chainId) =>
        fetchChainData(chainId)
      );
      const results = await Promise.all(chainPromises);
      // Update chain totals
      const newChainTotals = {};
      Object.keys(NETWORKS).forEach((chainId, index) => {
        newChainTotals[chainId] = {
          totalStaked: results[index].totalStaked,
          rewards: results[index].rewards,
          dailyEarnings: results[index].dailyEarnings,
        };
      });
      setChainTotals(newChainTotals);

      // Set stakes for the currently selected network
      setStakes(results[Object.keys(NETWORKS).indexOf(network)].stakes);
    } catch (error) {
      console.error("Error fetching chain data:", error);
      setError("Failed to fetch data. Make sure the address is correct.");
      setStakes([]);
    } finally {
      setLoading(false);
    }
  }, [address, network, fetchChainData]);

  useEffect(() => {
    if (address) {
      fetchAllChains();
    }
  }, [address, fetchAllChains]);

  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    const date = new Date(Number(timestamp) * 1000);
    return date.toLocaleDateString();
  };

  const formatEther = (wei, chainId = network) => {
    if (!wei) return "0";
    try {
      return ethers.formatUnits(wei, NETWORKS[chainId].decimals);
    } catch {
      return "0";
    }
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);

  const daysLeft = (unlockTimestamp) => {
    if (!unlockTimestamp) return 0;
    const now = Date.now();
    const unlockDate = new Date(Number(unlockTimestamp) * 1000);
    const diffMs = unlockDate - now;
    return diffMs > 0 ? Math.ceil(diffMs / (1000 * 60 * 60 * 24)) : 0;
  };

  const updateChain = (chain) => {
    setNetwork(chain);
    // Update stakes for the selected chain
    fetchChainData(chain).then((data) => {
      setStakes(data.stakes);
    });
  };

  const formatAmount = (wei, chainId = network) => {
    if (!wei) return formatCurrency(0);
    try {
      const amount = Number(formatEther(wei, chainId));
      return formatCurrency(amount);
    } catch {
      return formatCurrency(0);
    }
  };

  const sortData = (data, { key, direction }) => {
    if (!key) return data;

    return [...data].sort((a, b) => {
      let aValue = a[key];
      let bValue = b[key];

      // Handle numeric values
      if (key === "amount" || key === "dailyEarnings") {
        aValue = Number(formatEther(a[key]));
        bValue = Number(formatEther(b[key]));
      }
      // Handle percentage values
      else if (key === "dailyRewardRate") {
        aValue = Number(a[key]) / 100;
        bValue = Number(b[key]) / 100;
      }
      // Handle date values
      else if (key === "lastClaimed" || key === "unlockTime") {
        aValue = Number(a[key]);
        bValue = Number(b[key]);
      }
      // Handle days left
      else if (key === "daysLeft") {
        aValue = daysLeft(a.unlockTime);
        bValue = daysLeft(b.unlockTime);
      }

      if (aValue < bValue) return direction === "asc" ? -1 : 1;
      if (aValue > bValue) return direction === "asc" ? 1 : -1;
      return 0;
    });
  };

  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return "↕️";
    return sortConfig.direction === "asc" ? "↑" : "↓";
  };

  const filteredAndSortedStakes = sortData(
    stakes.filter((stake) => !hideCompleted || !stake.complete),
    sortConfig
  );

  const ChainSummaryTable = () => {
    const totalStakedAcrossChains = Object.values(chainTotals).reduce(
      (acc, chain) => acc + chain.totalStaked,
      0
    );
    const totalRewardsAcrossChains = Object.values(chainTotals).reduce(
      (acc, chain) => acc + chain.rewards,
      0
    );
    const totalDailyEarningsAcrossChains = Object.values(chainTotals).reduce(
      (acc, chain) => acc + chain.dailyEarnings,
      0
    );

    return (
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-3">Chain Summary</h2>
        <table className="min-w-full text-sm text-left border border-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 border">Chain</th>
              <th className="p-3 border">Total Staked</th>
              <th className="p-3 border">Unclaimed Rewards</th>
              <th className="p-3 border">Daily Earnings</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(chainTotals).map(([chain, data]) => (
              <tr key={chain} className="even:bg-gray-50">
                <td className="p-3 border">{NETWORKS[chain].name}</td>
                <td className="p-3 border">
                  {formatCurrency(data.totalStaked)}
                </td>
                <td className="p-3 border">{formatCurrency(data.rewards)}</td>
                <td className="p-3 border">
                  {formatCurrency(data.dailyEarnings)}
                </td>
              </tr>
            ))}
            <tr className="bg-gray-100 font-semibold">
              <td className="p-3 border">Total</td>
              <td className="p-3 border">
                {formatCurrency(totalStakedAcrossChains)}
              </td>
              <td className="p-3 border">
                {formatCurrency(totalRewardsAcrossChains)}
              </td>
              <td className="p-3 border">
                {formatCurrency(totalDailyEarningsAcrossChains)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white shadow rounded">
      <h1 className="text-3xl font-bold mb-6 text-center">
        Stake Viewer ({NETWORKS[network].name})
      </h1>
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Enter wallet address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="border p-2 w-full rounded shadow-sm"
        />
        <button
          onClick={fetchAllChains}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {loading ? "Loading..." : "Get Stakes"}
        </button>
      </div>
      <div className="flex gap-4 mb-6">
        <label className="flex items-center">
          <input
            type="radio"
            name="network"
            value="bsc"
            checked={network === "bsc"}
            onChange={() => updateChain("bsc")}
            className="mr-2"
          />
          BSC (USDT)
        </label>
        <label className="flex items-center">
          <input
            type="radio"
            name="network"
            value="base"
            checked={network === "base"}
            onChange={() => updateChain("base")}
            className="mr-2"
          />
          BASE (USDC)
        </label>
      </div>
      {error && <p className="text-red-600 mb-4 text-sm">{error}</p>}
      {Object.keys(chainTotals).length > 0 && <ChainSummaryTable />}
      {stakes?.length > 0 && (
        <div className="overflow-x-auto">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Stakes</h2>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={hideCompleted}
                onChange={(e) => setHideCompleted(e.target.checked)}
                className="form-checkbox h-4 w-4 text-blue-600"
              />
              <span>Hide Completed Stakes</span>
            </label>
          </div>
          <table className="min-w-full text-sm text-left border border-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th
                  className="p-3 border cursor-pointer hover:bg-gray-200"
                  onClick={() => requestSort("id")}
                >
                  ID {getSortIcon("id")}
                </th>
                <th
                  className="p-3 border cursor-pointer hover:bg-gray-200"
                  onClick={() => requestSort("amount")}
                >
                  Amount ({NETWORKS[network].token}) {getSortIcon("amount")}
                </th>
                <th
                  className="p-3 border cursor-pointer hover:bg-gray-200"
                  onClick={() => requestSort("lastClaimed")}
                >
                  Last Claimed {getSortIcon("lastClaimed")}
                </th>
                <th
                  className="p-3 border cursor-pointer hover:bg-gray-200"
                  onClick={() => requestSort("dailyRewardRate")}
                >
                  Daily Reward % {getSortIcon("dailyRewardRate")}
                </th>
                <th
                  className="p-3 border cursor-pointer hover:bg-gray-200"
                  onClick={() => requestSort("dailyEarnings")}
                >
                  Daily Earnings {getSortIcon("dailyEarnings")}
                </th>
                <th
                  className="p-3 border cursor-pointer hover:bg-gray-200"
                  onClick={() => requestSort("unlockTime")}
                >
                  Unlock Time {getSortIcon("unlockTime")}
                </th>
                <th
                  className="p-3 border cursor-pointer hover:bg-gray-200"
                  onClick={() => requestSort("daysLeft")}
                >
                  Days Left {getSortIcon("daysLeft")}
                </th>
                <th className="p-3 border">Complete</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedStakes.map((s) => (
                <tr key={s.id} className="even:bg-gray-50">
                  <td className="p-3 border">{s.id}</td>
                  <td className="p-3 border">{formatAmount(s.amount)}</td>
                  <td className="p-3 border">{formatDate(s.lastClaimed)}</td>
                  <td className="p-3 border">
                    {(Number(s.dailyRewardRate) / 100).toFixed(2)}%
                  </td>
                  <td className="p-3 border">
                    {formatCurrency(s.dailyEarnings)}
                  </td>
                  <td className="p-3 border">{formatDate(s.unlockTime)}</td>
                  <td className="p-3 border">{daysLeft(s.unlockTime)}</td>
                  <td className="p-3 border text-center">
                    {s.complete ? "✅" : "⏳"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
