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

  // Calculate total APRs across all chains
  const totalDailyAPR =
    totalStakedAcrossChains > 0
      ? (totalDailyEarningsAcrossChains / totalStakedAcrossChains) * 100
      : 0;
  const totalAnnualAPR = totalDailyAPR * 365;

  return (
    <div className="mb-6">
      <h2 className="text-xl font-semibold mb-4 dark:text-white">
        Chain Summary
      </h2>
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
                Rewards
              </th>
              <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-right font-semibold dark:text-white">
                Daily Earnings
              </th>
              <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-right font-semibold dark:text-white">
                Daily APR
              </th>
              <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-right font-semibold dark:text-white">
                Annual APR
              </th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(chainTotals).map(([chain, data]) => {
              // Calculate APRs for this chain
              const dailyAPR =
                data.totalStaked > 0
                  ? (data.dailyEarnings / data.totalStaked) * 100
                  : 0;
              const annualAPR = dailyAPR * 365;

              return (
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
                  <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-right dark:text-white">
                    {dailyAPR.toFixed(2)}%
                  </td>
                  <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-right dark:text-white">
                    {annualAPR.toFixed(2)}%
                  </td>
                </tr>
              );
            })}
            <tr className="bg-blue-50 dark:bg-blue-900/20 font-semibold">
              <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 dark:text-white">
                TOTAL
              </td>
              <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-right dark:text-white">
                {formatCurrency(totalStakedAcrossChains)}
              </td>
              <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-right dark:text-white">
                {formatCurrency(totalRewardsAcrossChains)}
              </td>
              <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-right dark:text-white">
                {formatCurrency(totalDailyEarningsAcrossChains)}
              </td>
              <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-right dark:text-white">
                {totalDailyAPR.toFixed(2)}%
              </td>
              <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-right dark:text-white">
                {totalAnnualAPR.toFixed(2)}%
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ChainSummaryTable;
