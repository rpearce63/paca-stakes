import React, { useState, useEffect } from "react";
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
  const [rewards, setRewards] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [network, setNetwork] = useState("bsc");

  const fetchStakes = async () => {
    if (!address) return;
    try {
      setLoading(true);
      setError("");
      const provider = new ethers.JsonRpcProvider(NETWORKS[network].rpc);
      const contract = new ethers.Contract(
        NETWORKS[network].contract,
        ABI,
        provider
      );
      const stakeData = await contract.getStakes(address);
      const rewardsData = await contract.viewRewards(address);
      setStakes(stakeData);
      setRewards(ethers.formatUnits(rewardsData, NETWORKS[network].decimals));
    } catch (err) {
      console.error(err);
      setError("Failed to fetch data. Make sure the address is correct.");
      setStakes([]);
      setRewards(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (address) {
      fetchStakes();
    }
  }, [network]);

  const formatDate = (timestamp) =>
    new Date(Number(timestamp) * 1000).toLocaleDateString();
  const formatEther = (wei) =>
    ethers.formatUnits(wei, NETWORKS[network].decimals);
  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);

  const totalStaked = stakes.reduce(
    (acc, s) => acc + Number(formatEther(s.amount)),
    0
  );

  const daysLeft = (unlockTimestamp) => {
    const now = Date.now();
    const unlockDate = new Date(Number(unlockTimestamp) * 1000);
    const diffMs = unlockDate - now;
    return diffMs > 0 ? Math.ceil(diffMs / (1000 * 60 * 60 * 24)) : 0;
  };

  const updateChain = (chain) => {
    setStakes([]);
    setNetwork(chain);
  };

  const formatAmount = (wei) => {
    const amount = Number(formatEther(wei));
    return formatCurrency(amount);
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
          onClick={fetchStakes}
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
      {(rewards !== null || stakes.length > 0) && (
        <div className="mb-4 text-gray-700 font-semibold text-center">
          <p>Total Staked: {formatCurrency(totalStaked)}</p>
          <p>
            Total Unclaimed {NETWORKS[network].token}:{" "}
            {formatCurrency(parseFloat(rewards || 0))}
          </p>
        </div>
      )}
      {stakes.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left border border-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 border">
                  Amount ({NETWORKS[network].token})
                </th>
                <th className="p-3 border">Last Claimed</th>
                <th className="p-3 border">Daily Reward %</th>
                <th className="p-3 border">Unlock Time</th>
                <th className="p-3 border">Days Left</th>
                <th className="p-3 border">Complete</th>
              </tr>
            </thead>
            <tbody>
              {stakes.map((s, i) => (
                <tr key={i} className="even:bg-gray-50">
                  <td className="p-3 border">{formatAmount(s.amount)}</td>
                  <td className="p-3 border">{formatDate(s.lastClaimed)}</td>
                  <td className="p-3 border">
                    {(Number(s.dailyRewardRate) / 100).toFixed(2)}%
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
