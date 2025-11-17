/*
 * partner.js
 *
 * This script powers the Partner Portal. It handles navigation between
 * sections, makes requests to serverless functions to manage merchants,
 * users, billing and commission reports, and persists branding settings for
 * merchants. All API calls are proxied through Netlify functions to keep
 * secrets safe; the client never sends sensitive keys to NMI directly.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Verify that the current user is a logged‑in partner
  const userType = localStorage.getItem('userType');
  const loggedIn = localStorage.getItem('loggedIn') === 'true';
  if (!loggedIn || userType !== 'partner') {
    window.location.href = 'login.html';
    return;
  }

  // Theme toggler: apply saved preference and allow switching between
  // dark and light modes.  The CSS uses CSS variables for colours.
  const themeToggleButton = document.getElementById('theme-toggle');
  // Apply saved theme on page load
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'light') {
    document.body.classList.add('light');
  }
  if (themeToggleButton) {
    themeToggleButton.addEventListener('click', () => {
      document.body.classList.toggle('light');
      const current = document.body.classList.contains('light') ? 'light' : 'dark';
      localStorage.setItem('theme', current);
    });
  }

  // Navigation handling
  const navButtons = document.querySelectorAll('nav button[data-section]');
  navButtons.forEach(button => {
    button.addEventListener('click', () => {
      const sectionId = button.getAttribute('data-section');
      if (sectionId === 'logout') {
        logout();
        return;
      }
      // Update active class on navigation
      navButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      // Show selected section and hide others
      document.querySelectorAll('main').forEach(main => {
        if (main.id === sectionId) {
          main.classList.add('active');
        } else {
          main.classList.remove('active');
        }
      });
    });
  });

  // Logout function
  function logout() {
    localStorage.removeItem('loggedIn');
    localStorage.removeItem('userType');
    localStorage.removeItem('partnerUsername');
    // Retain branding settings for merchants; they persist across logins
    window.location.href = 'login.html';
  }

  /* MERCHANT SECTION */
  const refreshMerchantsBtn = document.getElementById('refresh-merchants');
  const merchantsTableBody = document.querySelector('#merchants-table tbody');
  const merchantSearchInput = document.getElementById('merchant-search');
  refreshMerchantsBtn.addEventListener('click', async () => {
    merchantsTableBody.innerHTML = '';
    try {
      const res = await fetch('/.netlify/functions/listMerchants');
      if (!res.ok) throw new Error('Failed to fetch merchants');
      const text = await res.text();
      // The listMerchants function returns XML. Parse it into a DOM and then into JSON.
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(text, 'application/xml');
      const merchantNodes = xmlDoc.getElementsByTagName('merchant');
      for (let i = 0; i < merchantNodes.length; i++) {
        const m = merchantNodes[i];
        const id = m.getElementsByTagName('id')[0]?.textContent || '';
        const businessName = m.getElementsByTagName('company')[0]?.textContent || '';
        const dba = m.getElementsByTagName('dba')[0]?.textContent || '';
        const row = document.createElement('tr');
        row.innerHTML = `<td>${id}</td><td>${businessName}</td><td>${dba}</td>`;
        merchantsTableBody.appendChild(row);
      }
    } catch (err) {
      alert(err.message);
    }
  });

  // Filter merchants client‑side by searching table rows
  if (merchantSearchInput) {
    merchantSearchInput.addEventListener('input', () => {
      const term = merchantSearchInput.value.trim().toLowerCase();
      Array.from(merchantsTableBody.children).forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(term) ? '' : 'none';
      });
    });
  }

  // Create merchant
  const createMerchantForm = document.getElementById('create-merchant-form');
  createMerchantForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      company: document.getElementById('merchant-business-name').value.trim(),
      dba: document.getElementById('merchant-dba').value.trim(),
      owner_first_name: document.getElementById('merchant-owner-first').value.trim(),
      owner_last_name: document.getElementById('merchant-owner-last').value.trim(),
      currency: document.getElementById('merchant-currency').value,
      processor_id: document.getElementById('merchant-processor-id').value.trim(),
      pricing_id: document.getElementById('merchant-pricing-id').value.trim(),
    };
    try {
      const res = await fetch('/.netlify/functions/createMerchant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const statusEl = document.getElementById('create-merchant-status');
      statusEl.textContent = '';
      if (!res.ok) {
        const errorText = await res.text();
        statusEl.textContent = 'Error creating merchant: ' + errorText;
        statusEl.style.color = '#f85149';
        return;
      }
      // The createMerchant function returns the raw API response as text.  Display
      // it to the user and refresh the merchant list.
      const text = await res.text();
      statusEl.textContent = 'Merchant created successfully: ' + text;
      statusEl.style.color = '#2f81f7';
      refreshMerchantsBtn.click();
      createMerchantForm.reset();
    } catch (err) {
      alert(err.message);
    }
  });

  // Generate merchant key
  const generateMerchantKeyForm = document.getElementById('generate-merchant-key-form');
  const merchantKeyOutput = document.getElementById('merchant-key-output');
  generateMerchantKeyForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const merchantId = document.getElementById('generate-merchant-id').value.trim();
    if (!merchantId) {
      alert('Enter a merchant ID');
      return;
    }
    merchantKeyOutput.textContent = '';
    try {
      const res = await fetch(`/.netlify/functions/generateMerchantKey?merchant_id=${encodeURIComponent(merchantId)}`);
      if (!res.ok) throw new Error('Failed to generate key');
      const data = await res.json();
      merchantKeyOutput.textContent = 'Key: ' + data.key;
    } catch (err) {
      merchantKeyOutput.textContent = err.message;
    }
  });

  /* USERS SECTION */
  const listUsersForm = document.getElementById('list-users-form');
  const usersTableBody = document.querySelector('#users-table tbody');
  listUsersForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const merchantId = document.getElementById('list-users-merchant-id').value.trim();
    if (!merchantId) {
      alert('Enter a merchant ID');
      return;
    }
    usersTableBody.innerHTML = '';
    try {
      const res = await fetch(`/.netlify/functions/listUsers?merchant_id=${encodeURIComponent(merchantId)}`);
      if (!res.ok) throw new Error('Failed to list users');
      const xmlText = await res.text();
      // NMI returns user reports as XML.  Parse into DOM and extract
      // individual users.  Each <user> element contains child
      // elements like <id>, <username>, <first_name>, <last_name>,
      // <status>.
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, 'application/xml');
      const userNodes = xmlDoc.getElementsByTagName('user');
      for (let i = 0; i < userNodes.length; i++) {
        const u = userNodes[i];
        const id = u.getElementsByTagName('id')[0]?.textContent || '';
        const username = u.getElementsByTagName('username')[0]?.textContent || '';
        const firstName = u.getElementsByTagName('first_name')[0]?.textContent || '';
        const lastName = u.getElementsByTagName('last_name')[0]?.textContent || '';
        const status = u.getElementsByTagName('status')[0]?.textContent || '';
        const row = document.createElement('tr');
        row.innerHTML = `<td>${id}</td><td>${username}</td><td>${firstName}</td><td>${lastName}</td><td>${status}</td>`;
        usersTableBody.appendChild(row);
      }
    } catch (err) {
      // Display error in the table body instead of a blocking alert
      usersTableBody.innerHTML = '';
      const row = document.createElement('tr');
      const cell = document.createElement('td');
      cell.colSpan = 5;
      cell.textContent = 'Error retrieving users: ' + err.message;
      cell.style.color = '#f85149';
      row.appendChild(cell);
      usersTableBody.appendChild(row);
    }
  });

  // Create user
  const createUserForm = document.getElementById('create-user-form');
  createUserForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      merchant_id: document.getElementById('create-user-merchant-id').value.trim(),
      username: document.getElementById('create-username').value.trim(),
      password: document.getElementById('create-password').value,
      first_name: document.getElementById('create-first-name').value.trim(),
      last_name: document.getElementById('create-last-name').value.trim(),
      email: document.getElementById('create-email').value.trim(),
      role: document.getElementById('create-role').value,
      status: document.getElementById('create-status').value,
    };
    try {
      const res = await fetch('/.netlify/functions/createUser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const statusEl = document.getElementById('create-user-status');
      statusEl.textContent = '';
      if (!res.ok) {
        const errorText = await res.text();
        statusEl.textContent = 'Error creating user: ' + errorText;
        statusEl.style.color = '#f85149';
        return;
      }
      const text = await res.text();
      statusEl.textContent = 'User created successfully: ' + text;
      statusEl.style.color = '#2f81f7';
      createUserForm.reset();
    } catch (err) {
      const statusEl = document.getElementById('create-user-status');
      statusEl.textContent = 'Error creating user: ' + err.message;
      statusEl.style.color = '#f85149';
    }
  });

  /* BILLING SECTION */
  const billingForm = document.getElementById('billing-form');
  const billingOutput = document.getElementById('billing-output');
  billingForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const merchantId = document.getElementById('billing-merchant-id').value.trim();
    if (!merchantId) {
      alert('Enter a merchant ID');
      return;
    }
    billingOutput.textContent = 'Loading...';
    try {
      const res = await fetch(`/.netlify/functions/listBilling?merchant_id=${encodeURIComponent(merchantId)}`);
      if (!res.ok) throw new Error('Failed to get billing');
      const text = await res.text();
      billingOutput.textContent = text;
    } catch (err) {
      billingOutput.textContent = err.message;
    }
  });

  /* COMMISSION SECTION */
  const commissionForm = document.getElementById('commission-form');
  const commissionOutput = document.getElementById('commission-output');
  commissionForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const merchantId = document.getElementById('commission-merchant-id').value.trim();
    if (!merchantId) {
      alert('Enter a merchant ID');
      return;
    }
    commissionOutput.textContent = 'Loading...';
    try {
      const res = await fetch(`/.netlify/functions/listCommission?merchant_id=${encodeURIComponent(merchantId)}`);
      if (!res.ok) throw new Error('Failed to get commission');
      const text = await res.text();
      commissionOutput.textContent = text;
    } catch (err) {
      commissionOutput.textContent = err.message;
    }
  });

  /* BRANDING SECTION */
  const enableBrandingCheckbox = document.getElementById('enable-branding-checkbox');
  const brandingStatus = document.getElementById('branding-status');
  const saveBrandingButton = document.getElementById('save-branding');
  // Initialise checkbox based on saved setting
  enableBrandingCheckbox.checked = localStorage.getItem('merchantBrandingEnabled') === 'true';
  brandingStatus.textContent = enableBrandingCheckbox.checked ? 'Merchants can customise their branding.' : 'Custom branding is disabled for merchants.';

  // Save branding toggle
  saveBrandingButton.addEventListener('click', () => {
    const enabled = enableBrandingCheckbox.checked;
    localStorage.setItem('merchantBrandingEnabled', enabled.toString());
    brandingStatus.textContent = enabled ? 'Merchants can customise their branding.' : 'Custom branding is disabled for merchants.';
    alert('Branding setting saved.');
  });
});