/*
 * nmi.js
 *
 * Utility functions for interacting with the NMI v4 API from the browser.
 *
 * The functions in this module read the stored `apiKey` and optionally
 * `gatewayId` from `localStorage` (set during login) and use them to
 * authenticate requests. According to the NMI documentation, the v4 API
 * accepts a security key directly in the `Authorization` header with no
 * username and no "Basic" prefix【693907793079319†L299-L310】. You should
 * generate a private security key in your Merchant or Partner portal and
 * store it securely. For testing, you can use sandbox keys.
 *
 * All endpoints are relative to the base URL `https://secure.nmi.com/api/v4`.
 * See the NMI API reference for available endpoints and payload schemas.
 */

/**
 * Make an authenticated request to the NMI API.
 *
 * @param {string} endpoint Relative path starting with `/` (e.g. `/transactions`)
 * @param {string} method HTTP method (GET, POST, PUT, PATCH, DELETE)
 * @param {Object|null} data JSON payload for POST/PUT/PATCH requests
 * @returns {Promise<any>} Parsed JSON response from the API
 */
export async function callNmi(endpoint, method = 'GET', data = null) {
  const baseUrl = 'https://secure.nmi.com/api/v4';
  const apiKey = localStorage.getItem('apiKey');
  if (!apiKey) {
    throw new Error('API key not found in localStorage. Please sign in first.');
  }
  const url = `${baseUrl}${endpoint}`;
  const options = { method, headers: { Authorization: apiKey } };
  if (data) {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(data);
  }
  const response = await fetch(url, options);
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Request failed with status ${response.status}: ${text}`);
  }
  // Try to parse JSON; if not JSON, return raw text
  const contentType = response.headers.get('Content-Type') || '';
  if (contentType.includes('application/json')) {
    return response.json();
  }
  return response.text();
}

/**
 * Example helper to fetch transactions for a date range. Replace the endpoint
 * and payload with those defined in the NMI documentation.
 *
 * @param {string} start ISO‑8601 start date (e.g. 2025-01-01)
 * @param {string} end ISO‑8601 end date (e.g. 2025-01-31)
 */
export async function listTransactions(start, end) {
  // The actual endpoint and payload may differ; this is a placeholder example.
  const payload = { startDate: start, endDate: end };
  return callNmi('/transactions', 'POST', payload);
}

/**
 * Example helper to create a new subscription. Accepts amount, number of
 * payments (0 for unlimited) and frequency in days. The payload and
 * endpoint should be adjusted to match the NMI API specification.
 */
export async function createSubscription({ planAmount, planPayments = 0, frequency }) {
  const payload = {
    plan_amount: planAmount,
    plan_payments: planPayments,
    day_frequency: frequency,
  };
  return callNmi('/subscriptions', 'POST', payload);
}