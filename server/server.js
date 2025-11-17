/*
 * Express backend for the HausManager project.
 *
 * This server exposes a handful of RESTful endpoints that return JSON data for
 * orders, products, inventory, subscriptions and transactions. It also
 * demonstrates how to integrate with the NMI payment API using the built‑in
 * `fetch` API. If `NMI_SECURITY_KEY` is not set, responses are mocked.
 *
 * Environment variables are loaded from a `.env` file via the `dotenv`
 * package. See `.env.example` for a list of required variables. In
 * development you can copy that file to `.env` and populate the values.
 */

const express = require('express');
const cors = require('cors');
// `querystring` is unused because we now build URLSearchParams directly. Kept for
// backward compatibility but can be removed if unused in future updates.
// Load environment variables if dotenv is available. In restricted environments
// npm modules may not be installed, so we wrap this in a try/catch.
try {
  require('dotenv').config();
} catch (err) {
  // dotenv not installed. Environment variables must be set externally.
}

/*
 * Node 18+ includes a global `fetch` API. In earlier Node versions you
 * would need to import a library, but here we rely on the global fetch.
 */

const app = express();
const port = process.env.PORT || 3001;

// Enable CORS for all origins. In production you should restrict this to the
// domains that serve your front‑end to avoid security issues.
app.use(cors());
// Parse JSON request bodies.
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* --------------------------------------------------------------------------
 * Helper functions
 *
 * The following helper functions wrap calls to the NMI API and provide a
 * consistent promise‑based interface. When running without a configured
 * `NMI_SECURITY_KEY` the helpers will return mocked data so that the
 * front‑end still functions in a development environment.
 */

/**
 * Parse a response string from NMI (which comes back as newline separated
 * `key=value` pairs) into a plain JavaScript object.
 *
 * @param {string} body Raw NMI response body
 * @returns {Object}
 */
function parseNmiResponse(body) {
  return body.split(/\r?\n/).reduce((acc, line) => {
    const [key, ...rest] = line.split('=');
    acc[key] = rest.join('=');
    return acc;
  }, {});
}

/**
 * Send a transaction request to NMI. This function supports sale and auth
 * transactions. It automatically injects the security key and required
 * response fields. If `NMI_SECURITY_KEY` is not set the function will
 * resolve with a mock transaction object.
 *
 * @param {Object} params Additional parameters for the transaction (amount, etc)
 * @returns {Promise<Object>}
 */
async function callNmiTransaction(params) {
  const securityKey = process.env.NMI_SECURITY_KEY;
  const baseUrl = process.env.NMI_BASE_URL || 'https://secure.networkmerchants.com';
  const endpoint = `${baseUrl}/api/transact.php`;

  // If no key is configured return mocked data for demo purposes.
  if (!securityKey || securityKey === 'your_nmi_security_key_here') {
    return {
      response: '1',
      response_code: '100',
      response_text: 'TEST MODE: Transaction approved',
      transaction_id: `TEST${Math.floor(Math.random() * 1e6)}`,
      auth_code: 'TEST99',
      amount: params.amount || '0.00'
    };
  }

  // Build a URLSearchParams payload for form encoding
  const postData = new URLSearchParams({
    security_key: securityKey,
    ...params
  });

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: postData
    });
    const body = await response.text();
    return parseNmiResponse(body);
  } catch (error) {
    console.error('NMI request failed', error.message || error);
    throw error;
  }
}

/* --------------------------------------------------------------------------
 * Routes
 *
 * The API routes defined below provide example responses. Feel free to extend
 * them to your needs. In subsequent passes we will enrich these endpoints
 * with calls to NMI or a database.
 */

// In-memory collections. In a real application these would be persisted in a database.
const products = [
  { id: 'P001', name: 'Premium Jerky', sku: 'JERK-001', price: 799.0, stock: 42, category: 'Food' },
  { id: 'P002', name: 'Wireless POS Reader', sku: 'POS-002', price: 1899.0, stock: 15, category: 'Hardware' },
  { id: 'P003', name: 'Brand T‑Shirt', sku: 'TSHIRT-003', price: 399.0, stock: 73, category: 'Apparel' }
];
const orders = [
  {
    id: '10234',
    date: '2025-08-20T10:40:00',
    customer: 'Lerato M.',
    items: 3,
    amount: 1799.0,
    status: 'Paid'
  },
  {
    id: '10235',
    date: '2025-08-20T09:52:00',
    customer: 'A. Jacobs',
    items: 1,
    amount: 899.0,
    status: 'Pending'
  }
];
const inventory = [
  { id: 'INV001', name: 'Premium Jerky', status: 'In Stock', quantity: 42 },
  { id: 'INV002', name: 'Wireless POS Reader', status: 'Low', quantity: 15 },
  { id: 'INV003', name: 'Brand T‑Shirt', status: 'Out', quantity: 0 }
];
const subscriptions = [
  { id: 'SUB001', plan: 'Standard', customer: 'John S.', start: '2025-08-01', end: '2026-08-01', status: 'Active' },
  { id: 'SUB002', plan: 'Pro', customer: 'Sarah B.', start: '2025-07-10', end: '2026-07-10', status: 'Active' }
];
const transactions = [
  { id: 'TXN001', date: '2025-08-20', customer: 'Lerato M.', amount: 1799.0, method: 'Card', status: 'Approved', transactionId: 'ABC123' },
  { id: 'TXN002', date: '2025-08-20', customer: 'A. Jacobs', amount: 899.0, method: 'Card', status: 'Pending', transactionId: 'XYZ789' }
];

// GET /api/products – return a list of products. Supports optional search via
// query string. For example: `/api/products?search=jerky` returns products
// containing "jerky" in the name or SKU.
app.get('/api/products', (req, res) => {
  const search = (req.query.search || '').toLowerCase();
  if (!search) {
    return res.json(products);
  }
  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search) ||
    p.sku.toLowerCase().includes(search) ||
    p.category.toLowerCase().includes(search)
  );
  res.json(filtered);
});

// POST /api/products – add a new product to the collection
app.post('/api/products', (req, res) => {
  const { name, sku, price, stock, category } = req.body;
  if (!name || !sku || price == null || stock == null || !category) {
    return res.status(400).json({ error: 'Missing required product fields' });
  }
  // Generate a simple ID
  const id = `P${String(products.length + 1).padStart(3, '0')}`;
  const product = { id, name, sku, price: Number(price), stock: Number(stock), category };
  products.push(product);
  inventory.push({ id: `INV${String(inventory.length + 1).padStart(3, '0')}`, name, status: 'In Stock', quantity: Number(stock) });
  res.status(201).json(product);
});

// GET /api/orders – return a list of orders
app.get('/api/orders', (req, res) => {
  res.json(orders);
});

// POST /api/orders – process a sale transaction and create a new order record
app.post('/api/orders', async (req, res) => {
  const { amount, paymentToken, firstName, lastName, email, items } = req.body;
  if (!amount || !paymentToken) {
    return res.status(400).json({ error: 'Missing amount or payment token' });
  }
  try {
    const result = await callNmiTransaction({
      type: 'sale',
      amount,
      token: paymentToken,
      first_name: firstName,
      last_name: lastName,
      email
    });
    // Append new order to memory store
    const id = String(Number(orders[orders.length - 1]?.id || '10235') + 1);
    orders.push({
      id,
      date: new Date().toISOString(),
      customer: `${firstName} ${lastName}`,
      items: items || 1,
      amount: Number(amount),
      status: result.response === '1' ? 'Paid' : 'Failed'
    });
    // Also push a transaction record
    transactions.push({
      id: `TXN${String(transactions.length + 1).padStart(3, '0')}`,
      date: new Date().toISOString().split('T')[0],
      customer: `${firstName} ${lastName}`,
      amount: Number(amount),
      method: 'Card',
      status: result.response === '1' ? 'Approved' : 'Declined',
      transactionId: result.transaction_id || 'UNKNOWN'
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Payment failed' });
  }
});

// GET /api/inventory – return inventory data
app.get('/api/inventory', (req, res) => {
  res.json(inventory);
});

// GET /api/subscriptions – return a list of subscriptions
app.get('/api/subscriptions', (req, res) => {
  res.json(subscriptions);
});

// POST /api/subscriptions – create a subscription (stub)
app.post('/api/subscriptions', async (req, res) => {
  const { plan, amount, paymentToken, billingPeriod, customer } = req.body;
  if (!plan || !amount || !paymentToken) {
    return res.status(400).json({ error: 'Missing plan, amount or payment token' });
  }
  try {
    const result = await callNmiTransaction({
      type: 'sale',
      amount,
      token: paymentToken,
      recurring: 'add_subscription',
      plan,
      billing_period: billingPeriod || 'monthly'
    });
    // Add subscription to in-memory store
    const id = `SUB${String(subscriptions.length + 1).padStart(3, '0')}`;
    subscriptions.push({ id, plan, customer: customer || 'Unknown', start: new Date().toISOString().split('T')[0], end: '', status: result.response === '1' ? 'Active' : 'Failed' });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Subscription creation failed' });
  }
});

// GET /api/transactions – return sample transactions
app.get('/api/transactions', (req, res) => {
  res.json(transactions);
});

// GET /api/transactions/:id – return details for a single transaction
app.get('/api/transactions/:id', async (req, res) => {
  const { id } = req.params;
  const txn = transactions.find((t) => t.transactionId === id || t.id === id);
  if (txn) {
    return res.json(txn);
  }
  // When not found locally attempt to query NMI for additional details
  const securityKey = process.env.NMI_SECURITY_KEY;
  if (!securityKey || securityKey === 'your_nmi_security_key_here') {
    return res.status(404).json({ error: 'Transaction not found' });
  }
  try {
    // Query NMI for transaction details using the transaction ID. NMI's API
    // supports querying the gateway for specific transaction records via
    // `transaction_id` and `security_key`. See docs for more parameters.
    const postData = new URLSearchParams({
      security_key: securityKey,
      transaction_id: id,
      type: 'query'
    });
    const endpoint = `${process.env.NMI_BASE_URL || 'https://secure.networkmerchants.com'}/api/transact.php`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: postData
    });
    const body = await response.text();
    const parsed = parseNmiResponse(body);
    res.json(parsed);
  } catch (error) {
    res.status(404).json({ error: 'Transaction not found' });
  }
});

/**
 * POST /api/transactions/:id/refund – issue a refund against an existing transaction.
 *
 * The NMI API supports refunding a previous sale by submitting a request with
 * `type=refund` and the original `transactionid`. You do not need to include
 * the POI device ID. If an amount is not supplied the full amount will be
 * refunded according to the NMI docs【868180669395722†L524-L571】.
 */
app.post('/api/transactions/:id/refund', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await callNmiTransaction({ type: 'refund', transactionid: id });
    // Update in-memory transaction record if one exists
    const txn = transactions.find((t) => t.transactionId === id || t.id === id);
    if (txn) {
      txn.status = result.response === '1' ? 'Refunded' : 'Refund Failed';
    }
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Refund failed' });
  }
});

/**
 * POST /api/transactions/:id/void – void an existing sale or auth.
 *
 * Use this endpoint to cancel a sale or auth that has not yet settled. The
 * NMI docs explain that void requests require only the original `transactionid`
 * and `type=void` and will return a transaction response【868180669395722†L524-L544】.
 */
app.post('/api/transactions/:id/void', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await callNmiTransaction({ type: 'void', transactionid: id });
    const txn = transactions.find((t) => t.transactionId === id || t.id === id);
    if (txn) {
      txn.status = result.response === '1' ? 'Voided' : 'Void Failed';
    }
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Void failed' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(port, () => {
  console.log(`HausManager API server listening on port ${port}`);
});