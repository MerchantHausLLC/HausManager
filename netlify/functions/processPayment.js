// Function: processPayment
// Processes a sale transaction using the legacy NMI Payment API
// (`transact.php`).  Expects a JSON payload with fields:
// - payment_token: token returned from Collect.js
// - amount: numeric string representing the transaction amount
// - type: optional, defaults to 'sale'
// Requires the security key stored in `NMI_SECURITY_KEY`.

exports.handler = async function (event, context) {
  const securityKey = process.env.NMI_SECURITY_KEY;
  if (!securityKey) {
    return { statusCode: 500, body: 'Missing environment variable: NMI_SECURITY_KEY' };
  }
  if (!event.body) {
    return { statusCode: 400, body: 'Missing request body' };
  }
  let body;
  try {
    body = JSON.parse(event.body);
  } catch (err) {
    return { statusCode: 400, body: 'Invalid JSON: ' + err.toString() };
  }
  const paymentToken = body.payment_token;
  const amount = body.amount;
  const type = body.type || 'sale';
  if (!paymentToken || !amount) {
    return { statusCode: 400, body: 'payment_token and amount are required' };
  }
  const params = new URLSearchParams();
  params.append('security_key', securityKey);
  params.append('payment_token', paymentToken);
  params.append('amount', amount);
  params.append('type', type);
  // Append any optional fields from the incoming body
  for (const key of Object.keys(body)) {
    if (!['payment_token', 'amount', 'type'].includes(key)) {
      params.append(key, String(body[key]));
    }
  }
  try {
    const res = await fetch('https://secure.nmi.com/api/transact.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });
    const text = await res.text();
    return {
      statusCode: res.status,
      body: text,
    };
  } catch (err) {
    return { statusCode: 500, body: 'Error processing payment: ' + err.toString() };
  }
};