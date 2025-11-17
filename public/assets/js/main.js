/*
 * Front‑end helper functions for HausManager pages.
 *
 * This script provides functions to fetch data from the Express backend and
 * populate HTML tables. Each page should call the relevant `load...` method
 * when the DOM is ready. For example, `orders.html` calls `loadOrders()` to
 * inject order rows into its table body.
 */

/**
 * Fetch JSON from the given URL and return a promise. Any network
 * error will be logged to the console and the promise will reject.
 *
 * @param {string} url API endpoint to call
 * @returns {Promise<any>}
 */
async function fetchJson(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
}

/**
 * Load orders into the table body for the Orders page.
 */
export async function loadOrders() {
  const tbody = document.getElementById('orders-table-body');
  if (!tbody) return;
  try {
    const orders = await fetchJson('/api/orders');
    tbody.innerHTML = '';
    orders.forEach(order => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="py-2 pr-4 font-mono text-xs">#${order.id}</td>
        <td class="py-2 pr-4 whitespace-nowrap">${new Date(order.date).toLocaleString()}</td>
        <td class="py-2 pr-4">${order.customer}</td>
        <td class="py-2 pr-4">${order.items}</td>
        <td class="py-2 pr-4 text-right">R ${order.amount.toFixed(2)}</td>
        <td class="py-2 pr-4"><span class="inline-flex items-center rounded-full ${order.status === 'Paid' ? 'bg-emerald-900/50 text-emerald-300' : order.status === 'Pending' ? 'bg-amber-900/50 text-amber-300' : 'bg-red-900/50 text-red-300'} px-2 py-0.5">${order.status}</span></td>
        <td class="py-2 pr-4 text-right"><button data-id="${order.id}" class="view-order-btn rounded-md border border-slate-800 px-2 py-1 text-xs hover:bg-slate-800">View</button></td>
      `;
      tbody.appendChild(tr);
    });
  } catch (error) {
    tbody.innerHTML = '<tr><td colspan="7" class="py-4 text-center text-red-500">Failed to load orders.</td></tr>';
  }
}

/**
 * Load products into the table body for the Products page.
 */
export async function loadProducts() {
  const tbody = document.getElementById('products-table-body');
  if (!tbody) return;
  try {
    // If there's a search box present use its value to filter
    const searchInput = document.getElementById('product-search');
    const searchQuery = searchInput ? searchInput.value.trim() : '';
    const url = searchQuery ? `/api/products?search=${encodeURIComponent(searchQuery)}` : '/api/products';
    const products = await fetchJson(url);
    tbody.innerHTML = '';
    products.forEach(product => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="py-2 pr-4 font-mono text-xs">${product.sku}</td>
        <td class="py-2 pr-4 whitespace-nowrap">${product.name}</td>
        <td class="py-2 pr-4">${product.category}</td>
        <td class="py-2 pr-4 text-right">R ${product.price.toFixed(2)}</td>
        <td class="py-2 pr-4 text-right">${product.stock}</td>
        <td class="py-2 pr-4 text-right"><button class="rounded-md border border-slate-800 px-2 py-1 text-xs hover:bg-slate-800">Edit</button></td>
      `;
      tbody.appendChild(tr);
    });
  } catch (error) {
    tbody.innerHTML = '<tr><td colspan="6" class="py-4 text-center text-red-500">Failed to load products.</td></tr>';
  }
}

// Register product‑specific UI interactions
function initProductPageInteractions() {
  const searchInput = document.getElementById('product-search');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      loadProducts();
    });
  }
  const addButton = document.getElementById('add-product-btn');
  if (addButton) {
    addButton.addEventListener('click', async () => {
      const name = prompt('Enter product name:');
      if (!name) return;
      const sku = prompt('Enter SKU:');
      if (!sku) return;
      const category = prompt('Enter category:');
      if (!category) return;
      const priceStr = prompt('Enter price (numbers only):');
      const price = parseFloat(priceStr);
      if (isNaN(price)) return alert('Invalid price');
      const stockStr = prompt('Enter stock quantity:');
      const stock = parseInt(stockStr, 10);
      if (isNaN(stock)) return alert('Invalid stock');
      try {
        await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, sku, category, price, stock })
        });
        loadProducts();
      } catch (err) {
        alert('Failed to add product');
      }
    });
  }
}

function initSubscriptionPageInteractions() {
  const addButton = document.getElementById('add-subscription-btn');
  if (addButton) {
    addButton.addEventListener('click', async () => {
      const plan = prompt('Enter plan name (e.g., Standard, Pro):');
      if (!plan) return;
      const customer = prompt('Enter customer name:');
      if (!customer) return;
      const amountStr = prompt('Enter amount (numbers only):');
      const amount = parseFloat(amountStr);
      if (isNaN(amount)) return alert('Invalid amount');
      const paymentToken = prompt('Enter payment token (for demo put any string):');
      if (!paymentToken) return;
      try {
        await fetch('/api/subscriptions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plan, amount, paymentToken, customer })
        });
        loadSubscriptions();
      } catch (err) {
        alert('Failed to add subscription');
      }
    });
  }
}

// Register interactions for the Orders page
function initOrderPageInteractions() {
  const tbody = document.getElementById('orders-table-body');
  if (!tbody) return;
  tbody.addEventListener('click', async (event) => {
    const btn = event.target.closest('.view-order-btn');
    if (!btn) return;
    const id = btn.getAttribute('data-id');
    try {
      const data = await fetchJson(`/api/transactions/${id}`);
      alert(`Transaction ${id}\nStatus: ${data.status || data.response_text || 'Unknown'}\nAmount: R ${data.amount || data.amount || '0.00'}`);
    } catch (err) {
      alert('Transaction details not available');
    }
  });
}

/**
 * Load inventory items into the table body for the Inventory page.
 */
export async function loadInventory() {
  const tbody = document.getElementById('inventory-table-body');
  if (!tbody) return;
  try {
    const items = await fetchJson('/api/inventory');
    tbody.innerHTML = '';
    items.forEach(item => {
      const tr = document.createElement('tr');
      const statusStyles = item.status === 'In Stock' ? 'bg-emerald-900/50 text-emerald-300' : item.status === 'Low' ? 'bg-amber-900/50 text-amber-300' : 'bg-red-900/50 text-red-300';
      tr.innerHTML = `
        <td class="py-2 pr-4 font-mono text-xs">${item.id}</td>
        <td class="py-2 pr-4 whitespace-nowrap">${item.name}</td>
        <td class="py-2 pr-4"><span class="inline-flex items-center rounded-full ${statusStyles} px-2 py-0.5">${item.status}</span></td>
        <td class="py-2 pr-4 text-right">${item.quantity}</td>
      `;
      tbody.appendChild(tr);
    });
  } catch (error) {
    tbody.innerHTML = '<tr><td colspan="4" class="py-4 text-center text-red-500">Failed to load inventory.</td></tr>';
  }
}

/**
 * Load subscriptions into the table body for the Subscriptions page.
 */
export async function loadSubscriptions() {
  const tbody = document.getElementById('subscriptions-table-body');
  if (!tbody) return;
  try {
    const subs = await fetchJson('/api/subscriptions');
    tbody.innerHTML = '';
    subs.forEach(sub => {
      const statusStyles = sub.status === 'Active' ? 'bg-emerald-900/50 text-emerald-300' : 'bg-red-900/50 text-red-300';
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="py-2 pr-4 font-mono text-xs">${sub.id}</td>
        <td class="py-2 pr-4">${sub.plan}</td>
        <td class="py-2 pr-4">${sub.customer}</td>
        <td class="py-2 pr-4 whitespace-nowrap">${sub.start}</td>
        <td class="py-2 pr-4 whitespace-nowrap">${sub.end}</td>
        <td class="py-2 pr-4"><span class="inline-flex items-center rounded-full ${statusStyles} px-2 py-0.5">${sub.status}</span></td>
        <td class="py-2 pr-4 text-right"><button class="rounded-md border border-slate-800 px-2 py-1 text-xs hover:bg-slate-800">Edit</button></td>
      `;
      tbody.appendChild(tr);
    });
  } catch (error) {
    tbody.innerHTML = '<tr><td colspan="7" class="py-4 text-center text-red-500">Failed to load subscriptions.</td></tr>';
  }
}

/**
 * Load transactions into the table body for the Transactions page.
 */
export async function loadTransactions() {
  const tbody = document.getElementById('transactions-table-body');
  if (!tbody) return;
  try {
    const txns = await fetchJson('/api/transactions');
    tbody.innerHTML = '';
    txns.forEach(txn => {
      const statusStyles = txn.status === 'Approved' ? 'bg-emerald-900/50 text-emerald-300' : txn.status === 'Pending' ? 'bg-amber-900/50 text-amber-300' : 'bg-red-900/50 text-red-300';
      const tr = document.createElement('tr');
      // Build action buttons. Only allow refund/void for approved transactions
      let actionsHtml = `<button data-id="${txn.transactionId}" class="view-txn-btn rounded-md border border-slate-800 px-2 py-1 text-xs hover:bg-slate-800">View</button>`;
      if (txn.status === 'Approved') {
        actionsHtml += ` <button data-id="${txn.transactionId}" class="refund-txn-btn rounded-md border border-slate-800 px-2 py-1 text-xs hover:bg-slate-800">Refund</button>`;
      }
      tr.innerHTML = `
        <td class="py-2 pr-4 font-mono text-xs">${txn.transactionId}</td>
        <td class="py-2 pr-4 whitespace-nowrap">${txn.date}</td>
        <td class="py-2 pr-4">${txn.customer}</td>
        <td class="py-2 pr-4 text-right">R ${txn.amount.toFixed(2)}</td>
        <td class="py-2 pr-4">${txn.method}</td>
        <td class="py-2 pr-4"><span class="inline-flex items-center rounded-full ${statusStyles} px-2 py-0.5">${txn.status}</span></td>
        <td class="py-2 pr-4 text-right">${actionsHtml}</td>
      `;
      tbody.appendChild(tr);
    });
  } catch (error) {
    tbody.innerHTML = '<tr><td colspan="7" class="py-4 text-center text-red-500">Failed to load transactions.</td></tr>';
  }
}

// Register interactions for the Transactions page
function initTransactionsPageInteractions() {
  const tbody = document.getElementById('transactions-table-body');
  if (!tbody) return;
  tbody.addEventListener('click', async (event) => {
    const viewBtn = event.target.closest('.view-txn-btn');
    if (viewBtn) {
      const id = viewBtn.getAttribute('data-id');
      try {
        const data = await fetchJson(`/api/transactions/${id}`);
        alert(`Transaction ${id}\nStatus: ${data.status || data.response_text || 'Unknown'}\nAmount: R ${data.amount || data.amount || '0.00'}`);
      } catch (err) {
        alert('Transaction details not available');
      }
      return;
    }
    const refundBtn = event.target.closest('.refund-txn-btn');
    if (refundBtn) {
      const id = refundBtn.getAttribute('data-id');
      if (!confirm(`Are you sure you want to refund transaction ${id}?`)) return;
      try {
        const response = await fetch(`/api/transactions/${id}/refund`, { method: 'POST' });
        const data = await response.json();
        if (data.response === '1') {
          alert('Refund successful');
        } else {
          alert(`Refund failed: ${data.response_text || data.error || 'Unknown error'}`);
        }
        loadTransactions();
      } catch (err) {
        alert('Refund request failed');
      }
    }
  });
}

// Register a click handler on the New Order button
function initNewOrderButton() {
  const btn = document.getElementById('new-order-btn');
  if (!btn) return;
  btn.addEventListener('click', async () => {
    const firstName = prompt('First name:');
    if (!firstName) return;
    const lastName = prompt('Last name:');
    if (!lastName) return;
    const email = prompt('Customer email:');
    if (!email) return;
    const itemsStr = prompt('Number of items:');
    const items = parseInt(itemsStr, 10);
    if (isNaN(items)) return alert('Invalid item count');
    const amountStr = prompt('Total amount (numbers only):');
    const amount = parseFloat(amountStr);
    if (isNaN(amount)) return alert('Invalid amount');
    const paymentToken = prompt('Payment token (for demo use any string):');
    if (!paymentToken) return;
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, paymentToken, firstName, lastName, email, items })
      });
      const data = await res.json();
      if (data.response === '1') {
        alert('Payment successful');
      } else {
        alert(`Payment failed: ${data.response_text || data.error || 'Unknown error'}`);
      }
      loadOrders();
      loadTransactions();
    } catch (err) {
      alert('Order creation failed');
    }
  });
}

// On DOMContentLoaded, auto‑detect which page we are on based on the presence of
// specific table bodies and load data accordingly.
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('orders-table-body')) {
    loadOrders();
    initOrderPageInteractions();
    initNewOrderButton();
  }
  if (document.getElementById('products-table-body')) {
    loadProducts();
    initProductPageInteractions();
  }
  if (document.getElementById('inventory-table-body')) {
    loadInventory();
  }
  if (document.getElementById('subscriptions-table-body')) {
    loadSubscriptions();
    initSubscriptionPageInteractions();
  }
  if (document.getElementById('transactions-table-body')) {
    loadTransactions();
    initTransactionsPageInteractions();
  }
});