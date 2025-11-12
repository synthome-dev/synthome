import { getSynthomeApiUrl, getSynthomeApiKey } from "@synthome/sdk";

const executionId = "kltcrvq4x-TpMLFQIgpSX";
const apiUrl = getSynthomeApiUrl();
const apiKey = getSynthomeApiKey();

console.log("API URL:", apiUrl);
console.log("API Key exists:", !!apiKey);
console.log("Status URL:", `${apiUrl}/${executionId}/status`);

const statusUrl = `${apiUrl}/${executionId}/status`;

try {
  const response = await fetch(statusUrl, {
    headers: {
      ...(apiKey && { Authorization: `Bearer ${apiKey}` }),
    },
  });

  console.log("Response status:", response.status);
  console.log("Response statusText:", response.statusText);

  const body = await response.text();
  console.log("Response body:", body);
} catch (error) {
  console.error("Fetch error:", error);
}

process.exit(0);
