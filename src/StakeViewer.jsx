import React, { useState } from "react";
import { dataSlice, ethers } from "ethers";
import { ABI } from "./PacaABI";

const CONTRACT_ADDRESS = "0x3fF44D639a4982A4436f6d737430141aBE68b4E1";

const BSC_RPC = "https://bsc-dataseed.binance.org/";

export default function StakeViewer() {
  const [address, setAddress] = useState("");
  const [stakes, setStakes] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [totalStaked, setTotalStaked] = useState(0);

  const fetchStakes = async () => {
    try {
      setLoading(true);
      setError("");
      const provider = new ethers.JsonRpcProvider(BSC_RPC);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
      const data = await contract.getStakes(address);

      const rewards = await contract.viewRewards(address);
      const totalStaked = data.reduce(
        (acc, stake) => acc + Number(stake.amount) / 1e18,
        0
      );
      setTotalStaked(totalStaked);
      setRewards(rewards);

      setStakes(data);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch stakes. Make sure the address is correct.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp) =>
    new Date(Number(timestamp) * 1000).toLocaleDateString();
  const formatEther = (wei) => ethers.formatUnits(wei, 18);
  const formatEtherAsCurrency = (wei) =>
    Number(formatEther(wei)).toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
    });
  const formatCurrency = (amount) =>
    amount.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
    });

  const daysUntil = (date2) => {
    const date1 = new Date();
    const timeDiff = Math.abs(
      new Date(Number(date2) * 1000).getTime() - date1.getTime()
    );
    const daysDiff = Math.round(timeDiff / (1000 * 60 * 60 * 24));
    return daysDiff;
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">BSC Stake Viewer</h1>
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Enter wallet address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="border p-2 w-full rounded"
        />
        <button
          onClick={fetchStakes}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          {loading ? "Loading..." : "Get Stakes"}
        </button>
      </div>
      {error && <p className="text-red-500">{error}</p>}
      {stakes.length > 0 && (
        <table className="w-full border text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th>Total staked</th>
              <td>{formatCurrency(totalStaked)}</td>
              <th className="bg-gray-100">Total Rewards</th>
              <td className="p-2">{formatEtherAsCurrency(rewards)}</td>
            </tr>
            <tr className="bg-gray-100">
              <th className="border p-2">Stake ID</th>
              <th className="border p-2">Amount</th>
              <th className="border p-2">Last Claimed</th>
              <th className="border p-2">Daily Reward %</th>
              <th className="border p-2">Unlock Date</th>
              <th className="border p2">Unlock Days</th>
              <th className="border p-2">Complete</th>
            </tr>
          </thead>
          <tbody>
            {stakes
              //.filter((s) => !s.complete)

              .map(
                (s, i) =>
                  !s.complete && (
                    <tr key={i} className="border-t">
                      <td className="p-2">{i}</td>
                      <td className="p-2">{formatEtherAsCurrency(s.amount)}</td>
                      <td className="p-2">{formatDate(s.lastClaimed)}</td>
                      <td className="p-2">
                        {Number(s.dailyRewardRate) / 100}%
                      </td>
                      <td className="p-2">{formatDate(s.unlockTime)}</td>
                      <td className="p-2">{daysUntil(s.unlockTime)}</td>
                      <td className="p-2">{s.complete ? "✅" : "⏳"}</td>
                    </tr>
                  )
              )}
          </tbody>
        </table>
      )}
    </div>
  );
}
