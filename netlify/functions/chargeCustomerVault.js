// Function: chargeCustomerVault
// Charges a customer stored in the vault.  Accepts JSON with
// customer_vault_id (required) and optional amount.  Calls
// transact.php with type=sale and customer_vault_id.

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
  const vaultId = payload.customer_vault_id || payload.vault_id;
  const amount = payload.amount;
  if (!vaultId) {
    return { statusCode: 400, body: 'customer_vault_id is required' };
  }
  const params = new URLSearchParams();
  params.append('security_key', securityKey);
  params.append('customer_vault_id', vaultId);
  params.append('type', 'sale');
  if (amount) params.append('amount', String(amount));
  // Append other optional parameters
  for (const key of Object.keys(payload)) {
    if (!['customer_vault_id', 'vault_id', 'amount'].includes(key)) {
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
    return { statusCode: 500, body: 'Error charging customer: ' + err.toString() };
  }
};