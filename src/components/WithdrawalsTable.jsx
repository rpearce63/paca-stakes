import React from "react";
import { formatAmount, formatDate, formatTimeLeft } from "../utils/formatters";
import { NETWORKS } from "../constants/networks";

export default function WithdrawalsTable({
  withdrawals,
  network,
  showCompleted,
  onShowCompletedChange,
  withdrawnAmountsByStakeId,
}) {
  const decimals = NETWORKS[network].decimals;
  const showWithdrawnAmountCol = showCompleted;
  const showWithdrawnDateCol = showCompleted;
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold dark:text-white">
          {showCompleted
            ? "Withdrawals (including completed)"
            : "Pending Withdrawals"}
        </h2>
        {showCompleted && (
          <button
            className="text-blue-600 dark:text-blue-400 underline text-sm"
            onClick={() => onShowCompletedChange(false)}
          >
            Hide completed withdrawals
          </button>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-700">
              <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left font-semibold dark:text-white">
                Stake ID
              </th>
              <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-right font-semibold dark:text-white">
                Amount
              </th>
              {showWithdrawnAmountCol && (
                <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-right font-semibold dark:text-white">
                  Withdrawn Amount
                </th>
              )}
              <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left font-semibold dark:text-white">
                Unlock Time
              </th>
              {showWithdrawnDateCol && (
                <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left font-semibold dark:text-white">
                  Withdrawn Date
                </th>
              )}
              <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left font-semibold dark:text-white">
                Time Left
              </th>
            </tr>
          </thead>
          <tbody>
            {withdrawals.map((w, idx) => {
              const isCompleted = Number(w.amount) === 0;
              const withdrawnObj =
                isCompleted &&
                withdrawnAmountsByStakeId &&
                withdrawnAmountsByStakeId[w.stakeId]
                  ? withdrawnAmountsByStakeId[w.stakeId]
                  : null;
              const withdrawnAmount =
                withdrawnObj && withdrawnObj.amount
                  ? formatAmount(withdrawnObj.amount, decimals)
                  : isCompleted
                  ? "-"
                  : "";
              const withdrawnDate =
                withdrawnObj && withdrawnObj.timestamp
                  ? formatDate(withdrawnObj.timestamp)
                  : isCompleted
                  ? "-"
                  : "";
              return (
                <tr
                  key={w.stakeId || idx}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 font-mono dark:text-white">
                    {w.stakeId}
                  </td>
                  <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-right dark:text-white">
                    {formatAmount(w.amount, decimals)}
                  </td>
                  {showWithdrawnAmountCol && (
                    <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-right dark:text-white">
                      {withdrawnAmount}
                    </td>
                  )}
                  <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 dark:text-white">
                    {formatDate(w.unlockTime)}
                  </td>
                  {showWithdrawnDateCol && (
                    <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 dark:text-white">
                      {withdrawnDate}
                    </td>
                  )}
                  <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 dark:text-white">
                    {formatTimeLeft(w.unlockTime)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
