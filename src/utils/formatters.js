import { ethers } from "ethers";

export const formatDate = (timestamp) => {
  if (!timestamp) return "N/A";
  const date = new Date(Number(timestamp) * 1000);
  return date.toLocaleDateString();
};

export const formatEther = (wei, decimals) => {
  if (!wei) return "0";
  try {
    return ethers.formatUnits(wei, decimals);
  } catch {
    return "0";
  }
};

export const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);

export const formatAmount = (wei, decimals) => {
  if (!wei) return formatCurrency(0);
  try {
    const amount = Number(formatEther(wei, decimals));
    return formatCurrency(amount);
  } catch {
    return formatCurrency(0);
  }
};

export const daysLeft = (unlockTimestamp) => {
  if (!unlockTimestamp) return 0;
  const now = Date.now();
  const unlockDate = new Date(Number(unlockTimestamp) * 1000);
  const diffMs = unlockDate - now;
  return diffMs > 0 ? Math.floor(diffMs / (1000 * 60 * 60 * 24)) : 0;
};
