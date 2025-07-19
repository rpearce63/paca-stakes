import React, { useEffect, useState, useMemo } from "react";
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

  // State to trigger re-render every second for live countdown
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Calculate total pending amount
  const totalPendingAmount = withdrawals
    .filter((w) => Number(w.amount) > 0)
    .reduce((sum, w) => sum + Number(w.amount), 0);

  // Calculate total withdrawn amount
  const totalWithdrawnAmount = useMemo(() => {
    let manualTotal = 0;
    if (withdrawals && withdrawals.length > 0) {
      const completed = withdrawals.filter((w) => Number(w.amount) === 0);
      completed.forEach((w) => {
        if (withdrawnAmountsByStakeId && withdrawnAmountsByStakeId[w.stakeId]) {
          const amount = Number(withdrawnAmountsByStakeId[w.stakeId].amount);
          manualTotal += amount;
        }
      });
    }
    return manualTotal;
  }, [withdrawals, withdrawnAmountsByStakeId]);

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold dark:text-white">
          {showCompleted
            ? "Withdrawals (including completed)"
            : "Pending Withdrawals"}
        </h2>
        {showCompleted ? (
          <button
            className="text-blue-600 dark:text-blue-400 underline text-sm"
            onClick={() => onShowCompletedChange(false)}
          >
            Hide completed withdrawals
          </button>
        ) : (
          <button
            className="text-blue-600 dark:text-blue-400 underline text-sm"
            onClick={() => onShowCompletedChange(true)}
          >
            Show completed withdrawals
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
                    {!isCompleted
                      ? formatTimeLeft(w.unlockTime, now, { showSeconds: true })
                      : "-"}
                  </td>
                </tr>
              );
            })}
            {/* Total row for pending amounts only */}
            {!showCompleted && totalPendingAmount > 0 && (
              <tr className="bg-blue-50 dark:bg-blue-900/20 font-semibold">
                <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 dark:text-white">
                  <strong>Total Pending</strong>
                </td>
                <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-right dark:text-white">
                  <strong>
                    {formatAmount(totalPendingAmount.toString(), decimals)}
                  </strong>
                </td>
                {showWithdrawnAmountCol && (
                  <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-right dark:text-white">
                    -
                  </td>
                )}
                <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 dark:text-white">
                  -
                </td>
                {showWithdrawnDateCol && (
                  <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 dark:text-white">
                    -
                  </td>
                )}
                <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 dark:text-white">
                  -
                </td>
              </tr>
            )}
            {/* Total rows for all withdrawals (including completed) */}
            {showCompleted &&
              (totalPendingAmount > 0 || totalWithdrawnAmount > 0) && (
                <tr className="bg-gray-100 dark:bg-gray-700 font-semibold">
                  <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 dark:text-white">
                    <strong>Totals</strong>
                  </td>
                  <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-right dark:text-white">
                    <strong>
                      {totalPendingAmount > 0
                        ? formatAmount(totalPendingAmount.toString(), decimals)
                        : "-"}
                    </strong>
                  </td>
                  <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-right dark:text-white">
                    <strong>
                      {totalWithdrawnAmount > 0
                        ? (() => {
                            const decimalString =
                              totalWithdrawnAmount.toLocaleString("fullwide", {
                                useGrouping: false,
                              });
                            return formatAmount(decimalString, decimals);
                          })()
                        : Object.keys(withdrawnAmountsByStakeId).length === 0 &&
                          withdrawals.some((w) => Number(w.amount) === 0)
                        ? "Loading..."
                        : "-"}
                    </strong>
                  </td>
                  <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 dark:text-white">
                    -
                  </td>
                  <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 dark:text-white">
                    -
                  </td>
                  <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 dark:text-white">
                    -
                  </td>
                </tr>
              )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
