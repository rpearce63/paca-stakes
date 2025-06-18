#!/usr/bin/env node

/* eslint-env node */
/* eslint-disable no-undef */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.join(__dirname, "..", ".env");

// Function to read and parse .env file
function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const content = fs.readFileSync(filePath, "utf8");
  const env = {};

  content.split("\n").forEach((line) => {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith("#")) {
      const [key, ...valueParts] = trimmedLine.split("=");
      if (key && valueParts.length > 0) {
        env[key.trim()] = valueParts.join("=").trim();
      }
    }
  });

  return env;
}

// Function to write .env file
function writeEnvFile(filePath, env) {
  const lines = [];

  // Add build information
  lines.push("# Build Information");
  lines.push(`VITE_APP_VERSION=${env.VITE_APP_VERSION || "1.0.0"}`);
  lines.push(`VITE_BUILD_NUMBER=${env.VITE_BUILD_NUMBER || "001"}`);
  lines.push(
    `VITE_BUILD_DATE=${
      env.VITE_BUILD_DATE || new Date().toISOString().split("T")[0]
    }`
  );
  lines.push("");

  // Add other environment variables
  Object.entries(env).forEach(([key, value]) => {
    if (!key.startsWith("VITE_APP_") && !key.startsWith("VITE_BUILD_")) {
      lines.push(`${key}=${value}`);
    }
  });

  fs.writeFileSync(filePath, lines.join("\n"));
}

// Function to increment build number
function incrementBuildNumber(buildNumber) {
  const num = parseInt(buildNumber, 10);
  return String(num + 1).padStart(3, "0");
}

// Function to update version (optional - you can customize this logic)
function updateVersion(version) {
  // For now, just return the same version
  // You can implement semantic versioning logic here
  return version;
}

// Main execution
try {
  console.log("🔧 Incrementing build information...");

  // Read current .env file
  const currentEnv = readEnvFile(envPath);

  // Get current values or defaults
  const currentVersion = currentEnv.VITE_APP_VERSION || "1.0.0";
  const currentBuildNumber = currentEnv.VITE_BUILD_NUMBER || "000";

  // Increment build number
  const newBuildNumber = incrementBuildNumber(currentBuildNumber);
  const newVersion = updateVersion(currentVersion);
  const newBuildDate = new Date().toISOString().split("T")[0];

  // Update environment variables
  const updatedEnv = {
    ...currentEnv,
    VITE_APP_VERSION: newVersion,
    VITE_BUILD_NUMBER: newBuildNumber,
    VITE_BUILD_DATE: newBuildDate,
  };

  // Write updated .env file
  writeEnvFile(envPath, updatedEnv);

  console.log(`✅ Build information updated:`);
  console.log(`   Version: ${newVersion}`);
  console.log(`   Build: ${newBuildNumber}`);
  console.log(`   Date: ${newBuildDate}`);
} catch (error) {
  console.error("❌ Error updating build information:", error.message);
  process.exit(1);
}
