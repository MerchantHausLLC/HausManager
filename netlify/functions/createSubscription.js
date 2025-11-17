// Function: createSubscription
// Creates a recurring subscription.  Accepts JSON with
// payment_token (required) and optional parameters such as
// plan_payments, plan_amount, day_frequency.  Calls the legacy
// Payment API at `transact.php` with parameter recurring=add_subscription.

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
  params.append('recurring', 'add_subscription');
  params.append('payment_token', token);
  if (payload.plan_payments) params.append('plan_payments', String(payload.plan_payments));
  if (payload.plan_amount) params.append('plan_amount', String(payload.plan_amount));
  if (payload.day_frequency) params.append('day_frequency', String(payload.day_frequency));
  // Append any other fields directly
  for (const key of Object.keys(payload)) {
    if (!['payment_token', 'plan_payments', 'plan_amount', 'day_frequency'].includes(key)) {
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
    return { statusCode: 500, body: 'Error creating subscription: ' + err.toString() };
  }
};