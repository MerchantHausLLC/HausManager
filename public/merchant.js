/*
 * merchant.js
 *
 * This script powers the Merchant Portal. It loads the Collect.js
 * tokenisation library using a safe public key obtained from a Netlify
 * serverless function. When a customer enters their payment information
 * and submits a form, Collect.js returns a payment token to the callback.
 * This token is then sent to our serverless functions to process payments,
 * create subscriptions, or add customers to the vault.
 *
 * The merchant portal also includes functionality for issuing invoices,
 * querying transaction reports, and customising the look and feel of the
 * portal (when enabled by the partner). All user interface state is
 * persisted in localStorage.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Ensure the user is a logged‑in merchant
  const userType = localStorage.getItem('userType');
  const loggedIn = localStorage.getItem('loggedIn') === 'true';
  if (!loggedIn || userType !== 'merchant') {
    window.location.href = 'login.html';
    return;
  }

  // Theme toggler: apply saved preference and allow switching between
  // dark and light modes.  The CSS uses CSS variables for colours.
  const themeToggleButton = document.getElementById('theme-toggle');
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
  const merchantId = localStorage.getItem('merchantId') || '';
  document.getElementById('merchant-header').textContent = `Merchant Portal – ${merchantId}`;

  // Navigation handling
  const navButtons = document.querySelectorAll('nav button[data-section]');
  navButtons.forEach(button => {
    button.addEventListener('click', () => {
      const sectionId = button.getAttribute('data-section');
      if (sectionId === 'logout') {
        logout();
        return;
      }
      navButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      document.querySelectorAll('main').forEach(main => {
        if (main.id === sectionId) {
          main.classList.add('active');
        } else {
          main.classList.remove('active');
        }
      });
    });
  });

  function logout() {
    localStorage.removeItem('loggedIn');
    localStorage.removeItem('userType');
    localStorage.removeItem('merchantId');
    localStorage.removeItem('merchantUsername');
    // Keep branding settings since they belong to the partner or merchant
    window.location.href = 'login.html';
  }

  // Branding: apply previously saved settings if enabled
  const merchantBrandingEnabled = localStorage.getItem('merchantBrandingEnabled') === 'true';
  const brandingForm = document.getElementById('branding-form');
  const brandingMessage = document.getElementById('branding-message');
  const brandingColorInput = document.getElementById('branding-color');
  const brandingLogoInput = document.getElementById('branding-logo');
  // Set up branding fields based on saved values
  if (merchantBrandingEnabled) {
    brandingMessage.textContent = 'You can customise your portal colours and logo.';
    const savedColor = localStorage.getItem('merchantBrandColor');
    const savedLogo = localStorage.getItem('merchantLogo');
    if (savedColor) {
      brandingColorInput.value = savedColor;
      document.documentElement.style.setProperty('--colour-primary', savedColor);
    }
    if (savedLogo) {
      brandingLogoInput.value = savedLogo;
      applyLogo(savedLogo);
    }
  } else {
    brandingMessage.textContent = 'Custom branding is disabled. Please contact your partner to enable this feature.';
    brandingColorInput.disabled = true;
    brandingLogoInput.disabled = true;
    brandingForm.querySelector('button').disabled = true;
  }
  // Save branding settings when form is submitted
  brandingForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!merchantBrandingEnabled) return;
    const colour = brandingColorInput.value;
    const logo = brandingLogoInput.value.trim();
    localStorage.setItem('merchantBrandColor', colour);
    localStorage.setItem('merchantLogo', logo);
    document.documentElement.style.setProperty('--colour-primary', colour);
    applyLogo(logo);
    alert('Branding updated.');
  });
  function applyLogo(url) {
    const header = document.querySelector('header');
    let img = header.querySelector('img');
    if (!url) {
      if (img) img.remove();
      return;
    }
    if (!img) {
      img = document.createElement('img');
      img.style.maxHeight = '40px';
      img.style.marginRight = '0.5rem';
      header.insertBefore(img, header.firstChild);
    }
    img.src = url;
  }

  // Fetch tokenisation key and load Collect.js
  (async function loadCollect() {
    try {
      const res = await fetch('/.netlify/functions/getTokenizationKey');
      const data = await res.json();
      const key = data.key;
      if (!key) {
        console.warn('No tokenisation key returned');
        disablePaymentForms('Payment functionality unavailable: no tokenisation key');
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://secure.nmi.com/token/Collect.js';
      script.setAttribute('data-tokenization-key', key);
      script.onload = configureCollect;
      script.onerror = () => {
        console.error('Failed to load Collect.js');
        disablePaymentForms('Unable to load payment fields');
      };
      document.head.appendChild(script);
    } catch (err) {
      console.error(err);
      disablePaymentForms('Could not retrieve tokenisation key');
    }
  })();

  function disablePaymentForms(message) {
    // Disable buttons and show message
    ['payment-submit', 'subscription-submit', 'add-customer-submit'].forEach(id => {
      const btn = document.getElementById(id);
      if (btn) btn.disabled = true;
    });
    document.getElementById('payment-status').textContent = message;
    document.getElementById('subscription-status').textContent = message;
    document.getElementById('add-customer-status').textContent = message;
  }

  function configureCollect() {
    // Payment configuration
    CollectJS.configure({
      paymentSelector: '#payment-submit',
      variant: 'inline',
      fields: {
        ccnumber: { selector: '#payment-ccnumber', placeholder: 'Card Number' },
        ccexp: { selector: '#payment-ccexp', placeholder: 'MM/YY' },
        cvv: { selector: '#payment-cvv', placeholder: 'CVV' },
      },
      callback: async function (resp) {
        if (resp.error) {
          document.getElementById('payment-status').textContent = 'Tokenisation error: ' + resp.error.message;
          return;
        }
        const token = resp.token;
        const amount = document.getElementById('payment-amount').value.trim();
        const description = document.getElementById('payment-description').value.trim();
        if (!amount) {
          document.getElementById('payment-status').textContent = 'Please enter an amount.';
          return;
        }
        document.getElementById('payment-status').textContent = 'Processing payment...';
        try {
          const res = await fetch('/.netlify/functions/processPayment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ payment_token: token, amount, description }),
          });
          const text = await res.text();
          document.getElementById('payment-status').textContent = text;
        } catch (err) {
          document.getElementById('payment-status').textContent = 'Error processing payment: ' + err.message;
        }
      },
    });
    // Subscription configuration
    CollectJS.configure({
      paymentSelector: '#subscription-submit',
      variant: 'inline',
      fields: {
        ccnumber: { selector: '#subscription-ccnumber', placeholder: 'Card Number' },
        ccexp: { selector: '#subscription-ccexp', placeholder: 'MM/YY' },
        cvv: { selector: '#subscription-cvv', placeholder: 'CVV' },
      },
      callback: async function (resp) {
        if (resp.error) {
          document.getElementById('subscription-status').textContent = 'Tokenisation error: ' + resp.error.message;
          return;
        }
        const token = resp.token;
        const amount = document.getElementById('plan-amount').value.trim();
        const payments = document.getElementById('plan-payments').value.trim();
        const frequency = document.getElementById('day-frequency').value.trim();
        if (!amount || !frequency) {
          document.getElementById('subscription-status').textContent = 'Please enter plan amount and frequency.';
          return;
        }
        document.getElementById('subscription-status').textContent = 'Creating subscription...';
        try {
          const payload = {
            payment_token: token,
            plan_amount: amount,
            plan_payments: payments || '0',
            day_frequency: frequency,
          };
          const res = await fetch('/.netlify/functions/createSubscription', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          const text = await res.text();
          document.getElementById('subscription-status').textContent = text;
        } catch (err) {
          document.getElementById('subscription-status').textContent = 'Error creating subscription: ' + err.message;
        }
      },
    });
    // Add Customer to vault configuration
    CollectJS.configure({
      paymentSelector: '#add-customer-submit',
      variant: 'inline',
      fields: {
        ccnumber: { selector: '#vault-ccnumber', placeholder: 'Card Number' },
        ccexp: { selector: '#vault-ccexp', placeholder: 'MM/YY' },
        cvv: { selector: '#vault-cvv', placeholder: 'CVV' },
      },
      callback: async function (resp) {
        if (resp.error) {
          document.getElementById('add-customer-status').textContent = 'Tokenisation error: ' + resp.error.message;
          return;
        }
        const token = resp.token;
        const firstName = document.getElementById('vault-first-name').value.trim();
        const lastName = document.getElementById('vault-last-name').value.trim();
        const email = document.getElementById('vault-email').value.trim();
        document.getElementById('add-customer-status').textContent = 'Adding customer to vault...';
        try {
          const payload = {
            payment_token: token,
            first_name: firstName,
            last_name: lastName,
            email: email,
          };
          const res = await fetch('/.netlify/functions/addCustomerToVault', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          const text = await res.text();
          document.getElementById('add-customer-status').textContent = text;
        } catch (err) {
          document.getElementById('add-customer-status').textContent = 'Error adding customer: ' + err.message;
        }
      },
    });
  }

  /* Charge Vault Customer */
  const chargeForm = document.getElementById('charge-customer-form');
  chargeForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const vaultId = document.getElementById('charge-vault-id').value.trim();
    const amount = document.getElementById('charge-amount').value.trim();
    if (!vaultId || !amount) {
      document.getElementById('charge-status').textContent = 'Please enter vault ID and amount.';
      return;
    }
    document.getElementById('charge-status').textContent = 'Charging customer...';
    try {
      const res = await fetch('/.netlify/functions/chargeCustomerVault', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer_vault_id: vaultId, amount }),
      });
      const text = await res.text();
      document.getElementById('charge-status').textContent = text;
    } catch (err) {
      document.getElementById('charge-status').textContent = 'Error charging customer: ' + err.message;
    }
  });

  /* Invoice */
  const invoiceForm = document.getElementById('invoice-form');
  invoiceForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('invoice-email').value.trim();
    const amount = document.getElementById('invoice-amount').value.trim();
    const description = document.getElementById('invoice-description').value.trim();
    if (!email || !amount) {
      document.getElementById('invoice-status').textContent = 'Please enter customer email and amount.';
      return;
    }
    document.getElementById('invoice-status').textContent = 'Creating invoice...';
    try {
      const res = await fetch('/.netlify/functions/createInvoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, amount, description }),
      });
      const text = await res.text();
      document.getElementById('invoice-status').textContent = text;
    } catch (err) {
      document.getElementById('invoice-status').textContent = 'Error creating invoice: ' + err.message;
    }
  });

  /* Transactions */
  const transactionsForm = document.getElementById('transactions-form');
  const transactionsOutput = document.getElementById('transactions-output');
  transactionsForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const start = document.getElementById('transactions-start').value;
    const end = document.getElementById('transactions-end').value;
    if (!start || !end) {
      transactionsOutput.textContent = 'Please select start and end dates.';
      return;
    }
    transactionsOutput.textContent = 'Fetching transactions...';
    try {
      const res = await fetch('/.netlify/functions/listTransactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ start_date: start, end_date: end }),
      });
      const text = await res.text();
      transactionsOutput.textContent = text;
    } catch (err) {
      transactionsOutput.textContent = 'Error fetching transactions: ' + err.message;
    }
  });
});