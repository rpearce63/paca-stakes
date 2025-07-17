import { formatEther, daysLeft } from "./formatters";

export const sortData = (data, { key, direction }, networkDecimals) => {
  if (!key) return data;

  return [...data].sort((a, b) => {
    let aValue = a[key];
    let bValue = b[key];

    // Handle numeric values
    if (key === "amount" || key === "dailyEarnings") {
      aValue = Number(formatEther(a[key], networkDecimals));
      bValue = Number(formatEther(b[key], networkDecimals));
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
    // Handle days left - completed stakes should be sorted last
    else if (key === "daysLeft") {
      const aDaysLeft = daysLeft(a.unlockTime);
      const bDaysLeft = daysLeft(b.unlockTime);

      // If both are completed (daysLeft <= 0), sort by original unlock time (newest first)
      if (aDaysLeft <= 0 && bDaysLeft <= 0) {
        aValue = Number(a.unlockTime);
        bValue = Number(b.unlockTime);
      }
      // If only one is completed, completed stakes go last
      else if (aDaysLeft <= 0) {
        aValue = Infinity; // Completed stakes go last
        bValue = bDaysLeft;
      } else if (bDaysLeft <= 0) {
        aValue = aDaysLeft;
        bValue = Infinity; // Completed stakes go last
      }
      // Both are active, sort by days left
      else {
        aValue = aDaysLeft;
        bValue = bDaysLeft;
      }
    }

    if (aValue < bValue) return direction === "asc" ? -1 : 1;
    if (aValue > bValue) return direction === "asc" ? 1 : -1;
    return 0;
  });
};

export const getSortIcon = (sortConfig, key) => {
  if (sortConfig.key !== key) return "↕️";
  return sortConfig.direction === "asc" ? "↑" : "↓";
};
