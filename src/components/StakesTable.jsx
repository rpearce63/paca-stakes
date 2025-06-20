import React from "react";
import {
  formatCurrency,
  formatDate,
  formatTimeLeft,
} from "../utils/formatters";
import { NETWORKS } from "../constants/networks";

export default function StakesTable({
  stakes,
  network,
  hideCompleted,
  setHideCompleted,
  requestSort,
  getSortIcon,
}) {
  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold dark:text-white">Stakes</h2>
        <div className="flex items-center space-x-3">
          <span className="text-sm text-gray-600 dark:text-gray-300">
            Show completed stakes
          </span>
          <button
            onClick={() => setHideCompleted(!hideCompleted)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${
              hideCompleted
                ? "bg-gray-200 dark:bg-gray-600"
                : "bg-blue-600 dark:bg-blue-500"
            }`}
            role="switch"
            aria-checked={!hideCompleted}
            aria-label="Toggle completed stakes visibility"
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                hideCompleted ? "translate-x-1" : "translate-x-6"
              }`}
            />
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-700">
              <th
                className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left font-semibold cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 dark:text-white"
                onClick={() => requestSort("amount")}
              >
                Amount {getSortIcon("amount")}
              </th>
              <th
                className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left font-semibold cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 dark:text-white"
                onClick={() => requestSort("dailyRewardRate")}
              >
                Daily Rate {getSortIcon("dailyRewardRate")}
              </th>
              <th
                className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left font-semibold cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 dark:text-white"
                onClick={() => requestSort("dailyEarnings")}
              >
                Daily Earnings {getSortIcon("dailyEarnings")}
              </th>
              <th
                className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left font-semibold cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 dark:text-white"
                onClick={() => requestSort("unlockTime")}
              >
                Unlock Date {getSortIcon("unlockTime")}
              </th>
              <th
                className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left font-semibold cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 dark:text-white"
                onClick={() => requestSort("daysLeft")}
              >
                Time Left {getSortIcon("daysLeft")}
              </th>
              <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left font-semibold dark:text-white">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {stakes.map((stake, index) => (
              <tr
                key={index}
                className="hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 dark:text-white">
                  {formatCurrency(
                    Number(stake.amount) /
                      Math.pow(10, NETWORKS[network].decimals)
                  )}
                </td>
                <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 dark:text-white">
                  {Number(stake.dailyRewardRate) / 100}%
                </td>
                <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 dark:text-white">
                  {formatCurrency(stake.dailyEarnings)}
                </td>
                <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 dark:text-white">
                  {formatDate(stake.unlockTime)}
                </td>
                <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 dark:text-white">
                  {formatTimeLeft(stake.unlockTime)}
                </td>
                <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      stake.complete
                        ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                        : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300"
                    }`}
                  >
                    {stake.complete ? "Completed" : "Active"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
