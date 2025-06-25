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

export const secondsLeft = (unlockTimestamp) => {
  if (!unlockTimestamp) return 0;
  const now = Date.now();
  const unlockDate = new Date(Number(unlockTimestamp) * 1000);
  const diffMs = unlockDate - now;
  return diffMs > 0 ? Math.floor(diffMs / 1000) : 0;
};

export const formatTimeLeft = (unlockTimestamp) => {
  const seconds = secondsLeft(unlockTimestamp);
  if (seconds <= 0) return "0";
  const days = Math.floor(seconds / (60 * 60 * 24));
  const hours = Math.floor((seconds % (60 * 60 * 24)) / (60 * 60));

  if (days >= 7) {
    return `${days}d`;
  } else if (days >= 1) {
    return `${days}d:${hours}h`;
  } else {
    const totalHours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${totalHours}h:${mins}m`;
  }
};
