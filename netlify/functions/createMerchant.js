// Function: createMerchant
// Creates a new merchant using the NMI v4 API.  Expects a JSON
// payload in the request body with the following fields:
// - business_name: string
// - first_name: string
// - last_name: string
// - email: string
// - phone: string (optional)
// The partner‑level API key must be provided via the
// `NMI_PARTNER_KEY` environment variable.  The NMI API will return
// JSON describing the created merchant or an error.

exports.handler = async function (event, context) {
  const partnerKey = process.env.NMI_PARTNER_KEY;
  if (!partnerKey) {
    return { statusCode: 500, body: 'Missing environment variable: NMI_PARTNER_KEY' };
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
  try {
    const res = await fetch('https://secure.nmi.com/api/v4/merchants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: partnerKey },
      body: JSON.stringify(payload),
    });
    const text = await res.text();
    return {
      statusCode: res.status,
      body: text,
    };
  } catch (err) {
    return { statusCode: 500, body: 'Error creating merchant: ' + err.toString() };
  }
};