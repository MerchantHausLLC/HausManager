// Function: createInvoice
// Creates an invoice using the legacy Payment API.  Accepts JSON
// with email (customer email) and amount, along with optional
// invoice details.  Calls transact.php with invoicing=add_invoice.

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
  const email = payload.email;
  const amount = payload.amount;
  if (!email || !amount) {
    return { statusCode: 400, body: 'email and amount are required' };
  }
  const params = new URLSearchParams();
  params.append('security_key', securityKey);
  params.append('invoicing', 'add_invoice');
  params.append('email', email);
  params.append('amount', String(amount));
  // Append any additional fields
  for (const key of Object.keys(payload)) {
    if (!['email', 'amount'].includes(key)) {
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
    return { statusCode: 500, body: 'Error creating invoice: ' + err.toString() };
  }
};