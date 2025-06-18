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
    // Handle days left
    else if (key === "daysLeft") {
      aValue = daysLeft(a.unlockTime);
      bValue = daysLeft(b.unlockTime);
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
