// Function: createUser
// Creates a user via the NMI v4 API.  Expects a JSON payload with
// fields: merchant_id, username, email, first_name, last_name, role.
// Requires the partner API key from `NMI_PARTNER_KEY`.

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
    const res = await fetch('https://secure.nmi.com/api/v4/users', {
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
    return { statusCode: 500, body: 'Error creating user: ' + err.toString() };
  }
};