import React from "react";
import { NETWORKS } from "../constants/networks";
import { formatCurrency } from "../utils/formatters";

const ChainSummaryTable = ({ chainTotals }) => {
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
              <td className="p-3 border">{formatCurrency(data.totalStaked)}</td>
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

export default ChainSummaryTable;
