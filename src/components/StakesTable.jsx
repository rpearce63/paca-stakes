import React from "react";
import { NETWORKS } from "../constants/networks";
import {
  formatDate,
  formatAmount,
  formatCurrency,
  daysLeft,
} from "../utils/formatters";

const StakesTable = ({
  stakes,
  network,
  hideCompleted,
  setHideCompleted,
  requestSort,
  getSortIcon,
}) => {
  return (
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
          {stakes.map((s) => (
            <tr key={s.id} className="even:bg-gray-50">
              <td className="p-3 border">{s.id}</td>
              <td className="p-3 border">
                {formatAmount(s.amount, NETWORKS[network].decimals)}
              </td>
              <td className="p-3 border">{formatDate(s.lastClaimed)}</td>
              <td className="p-3 border">
                {(Number(s.dailyRewardRate) / 100).toFixed(2)}%
              </td>
              <td className="p-3 border">{formatCurrency(s.dailyEarnings)}</td>
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
  );
};

export default StakesTable;
