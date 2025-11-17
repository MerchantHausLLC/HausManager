// Function: createUser
// Creates a user via the NMI v4 API.  Expects a JSON payload with
// at minimum the following fields:
//   - merchant_id: string – ID of the merchant this user belongs to
//   - username: string    – Username for the new user
//   - password: string    – Initial password for the user
//   - first_name: string  – User's first name
//   - last_name: string   – User's last name
// Optional fields include:
//   - email: string       – User email address
//   - role: string        – Role (principal, admin, user, readonly)
//   - status: string      – Status (active or inactive)
// The partner API key must be set in `NMI_PARTNER_KEY`.  This
// function forwards the provided payload directly to the NMI v4
// users endpoint.

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
  // Forward the payload to the NMI v4 users endpoint.  Any fields
  // supplied in the payload (including password and status) will be
  // forwarded.  NMI will validate required fields and return an error
  // if any mandatory fields are missing or invalid.
  try {
    const res = await fetch('https://secure.nmi.com/api/v4/users', {
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
    return { statusCode: 500, body: 'Error creating user: ' + err.toString() };
  }
};