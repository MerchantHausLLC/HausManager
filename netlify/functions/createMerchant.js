// Function: createMerchant
// Creates a new merchant using the NMI v4 API.  Expects a JSON
// payload in the request body with the following fields:
// - company: string            – Full legal business name
// - dba: string                – Doing business as name
// - owner_first_name: string   – Merchant owner first name
// - owner_last_name: string    – Merchant owner last name
// - currency: string           – ISO currency code (e.g. USD, ZAR)
// - processor_id: string       – Processor ID assigned by NMI
// - pricing_id: string         – Pricing plan ID assigned by NMI
// The partner‑level API key must be provided via the
// `NMI_PARTNER_KEY` environment variable.  The payload is sent
// directly to the NMI v4 endpoint.  On success the function
// returns the API response body (usually JSON) along with the
// HTTP status code.

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
  // Forward the payload directly to the NMI merchants endpoint.  NMI
  // accepts a wide variety of fields; this function does not enforce
  // required fields here to allow flexible merchant onboarding.
  try {
    const res = await fetch('https://secure.nmi.com/api/v4/merchants', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: partnerKey,
      },
      body: JSON.stringify(payload),
    });
    const text = await res.text();
    return {
      statusCode: res.status,
      body: text,
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: 'Error creating merchant: ' + err.toString(),
    };
  }
};