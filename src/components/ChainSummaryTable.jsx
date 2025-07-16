import React from "react";
import { formatCurrency } from "../utils/formatters";
import { NETWORKS } from "../constants/networks";

export default function ChainSummaryTable({ chainTotals }) {
  const totalStaked = Object.values(chainTotals).reduce(
    (sum, chain) => sum + chain.totalStaked,
    0
  );
  const totalRewards = Object.values(chainTotals).reduce(
    (sum, chain) => sum + chain.rewards,
    0
  );
  const totalDailyEarnings = Object.values(chainTotals).reduce(
    (sum, chain) => sum + chain.dailyEarnings,
    0
  );

  // Calculate average APRs
  const avgDailyAPR =
    totalStaked > 0 ? (totalDailyEarnings / totalStaked) * 100 : 0;
  const avgAnnualAPR = avgDailyAPR * 365;

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
                Claimable Funds
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
            {Object.entries(chainTotals)
              .filter(([, data]) => data.totalStaked > 0)
              .map(([chainId, data]) => {
                const dailyAPR =
                  data.totalStaked > 0
                    ? (data.dailyEarnings / data.totalStaked) * 100
                    : 0;
                const annualAPR = dailyAPR * 365;
                return (
                  <tr
                    key={chainId}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 font-medium dark:text-white">
                      {NETWORKS[chainId].name} ({NETWORKS[chainId].token})
                    </td>
                    <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-right dark:text-white">
                      {formatCurrency(data.totalStaked)}
                    </td>
                    <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-right dark:text-white">
                      {formatCurrency(data.rewards)}
                    </td>
                    <td
                      className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-right dark:text-white"
                      title={`Weekly: ${formatCurrency(
                        data.dailyEarnings * 7
                      )}\nMonthly: ${formatCurrency(data.dailyEarnings * 30)}`}
                    >
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
                {formatCurrency(totalStaked)}
              </td>
              <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-right dark:text-white">
                {formatCurrency(totalRewards)}
              </td>
              <td
                className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-right dark:text-white"
                title={`Weekly: ${formatCurrency(
                  totalDailyEarnings * 7
                )}\nMonthly: ${formatCurrency(totalDailyEarnings * 30)}`}
              >
                {formatCurrency(totalDailyEarnings)}
              </td>
              <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-right dark:text-white">
                {avgDailyAPR.toFixed(2)}%
              </td>
              <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-right dark:text-white">
                {avgAnnualAPR.toFixed(2)}%
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
