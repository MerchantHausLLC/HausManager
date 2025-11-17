/*
 * login.js
 *
 * Handles authentication for both partner and merchant roles. This script
 * persists the user type, merchant ID (if applicable) and login state in
 * localStorage. When a user logs in, they are redirected to the appropriate
 * portal. If a user is already logged in and attempts to visit the login page,
 * they are automatically redirected to the last active portal.
 */

document.addEventListener('DOMContentLoaded', () => {
  // If the user is already logged in, redirect based on stored userType
  const userType = localStorage.getItem('userType');
  const loggedIn = localStorage.getItem('loggedIn') === 'true';
  if (loggedIn && userType) {
    if (userType === 'partner') {
      window.location.href = 'partner.html';
    } else if (userType === 'merchant') {
      window.location.href = 'merchant.html';
    }
    return;
  }

  // Handle partner login
  const partnerForm = document.getElementById('partner-login-form');
  partnerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('partner-username').value.trim();
    const password = document.getElementById('partner-password').value;
    // Basic validation
    if (!username || !password) {
      alert('Please enter a username and password.');
      return;
    }
    // In a real application you would authenticate the user against a server.
    // For this demo, we simply record that a partner has logged in.
    localStorage.setItem('loggedIn', 'true');
    localStorage.setItem('userType', 'partner');
    // On first login, default merchant branding is disabled
    if (localStorage.getItem('merchantBrandingEnabled') === null) {
      localStorage.setItem('merchantBrandingEnabled', 'false');
    }
    // Optional: store partner username (no password) for display purposes
    localStorage.setItem('partnerUsername', username);
    window.location.href = 'partner.html';
  });

  // Handle merchant login
  const merchantForm = document.getElementById('merchant-login-form');
  merchantForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const merchantId = document.getElementById('merchant-id').value.trim();
    const password = document.getElementById('merchant-password').value;
    if (!merchantId || !password) {
      alert('Please enter your merchant ID and password.');
      return;
    }
    // In a real application you would authenticate the merchant and verify
    // their credentials. Here, we simply record the merchant ID.
    localStorage.setItem('loggedIn', 'true');
    localStorage.setItem('userType', 'merchant');
    localStorage.setItem('merchantId', merchantId);
    // Determine if merchant branding is enabled; if not previously set,
    // default to false (controlled by partner portal)
    if (localStorage.getItem('merchantBrandingEnabled') === null) {
      localStorage.setItem('merchantBrandingEnabled', 'false');
    }
    // Optionally store merchant username for display
    localStorage.setItem('merchantUsername', merchantId);
    window.location.href = 'merchant.html';
  });
});