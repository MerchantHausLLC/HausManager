// scripts for the merchant portal page
// Handles tab switching and any future interactions for merchant operations
document.addEventListener('DOMContentLoaded', () => {
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  function showTab(tabName) {
    // hide all sections
    tabContents.forEach((section) => {
      section.classList.add('hidden');
    });
    // remove active from all buttons
    tabButtons.forEach((btn) => {
      btn.classList.remove('active');
    });
    // show selected tab and mark button active
    const activeSection = document.getElementById(`tab-${tabName}`);
    if (activeSection) activeSection.classList.remove('hidden');
    const activeBtn = document.querySelector(`.tab-btn[data-tab="${tabName}"]`);
    if (activeBtn) activeBtn.classList.add('active');
  }

  // attach click handlers
  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-tab');
      if (target) showTab(target);
    });
  });

  // Optionally handle the Pay Now button; currently shows message only
  const payNowBtn = document.getElementById('pay-now');
  if (payNowBtn) {
    payNowBtn.addEventListener('click', async () => {
      const message = document.getElementById('payment-message');
      if (message) {
        message.textContent =
          'Payment functionality unavailable: no tokenisation key. Please configure your tokenisation key in the environment.';
      }
    });
  }
});