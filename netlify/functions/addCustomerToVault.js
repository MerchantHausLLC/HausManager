// Function: addCustomerToVault
// Adds a customer to the NMI Customer Vault.  Accepts JSON with
// payment_token (required) and optional customer details like
// first_name, last_name, etc.  Calls the Payment API with
// customer_vault=add_customer.

exports.handler = async function (event, context) {
  const securityKey = process.env.NMI_SECURITY_KEY;
  if (!securityKey) {
    return { statusCode: 500, body: 'Missing environment variable: NMI_SECURITY_KEY' };
  }
  if (!event.body) {
    return { statusCode: 400, body: 'Missing request body' };
  }
  let payload;
  try {
    payload = JSON.parse(event.body);
  } catch (err) {
    return { statusCode: 400, body: 'Invalid JSON: ' + err.toString() };
  }
  const token = payload.payment_token;
  if (!token) {
    return { statusCode: 400, body: 'payment_token is required' };
  }
  const params = new URLSearchParams();
  params.append('security_key', securityKey);
  params.append('customer_vault', 'add_customer');
  params.append('payment_token', token);
  // Append optional fields (name, email etc.)
  for (const key of Object.keys(payload)) {
    if (key !== 'payment_token') {
      params.append(key, String(payload[key]));
    }
  }
  try {
    const res = await fetch('https://secure.nmi.com/api/transact.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });
    const text = await res.text();
    return { statusCode: res.status, body: text };
  } catch (err) {
    return { statusCode: 500, body: 'Error adding customer: ' + err.toString() };
  }
};