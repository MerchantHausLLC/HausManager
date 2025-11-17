// Function: listUsers
// Returns a list of users using the NMI v4 API.  Requires the
// `NMI_PARTNER_KEY` environment variable.  This function is used
// to populate user lists in the partner portal.

exports.handler = async function (event, context) {
  const partnerKey = process.env.NMI_PARTNER_KEY;
  if (!partnerKey) {
    return { statusCode: 500, body: 'Missing environment variable: NMI_PARTNER_KEY' };
  }
  try {
    const res = await fetch('https://secure.nmi.com/api/v4/users/reports', {
      method: 'GET',
      headers: { Authorization: partnerKey },
    });
    const body = await res.text();
    return {
      statusCode: res.status,
      body,
    };
  } catch (err) {
    return { statusCode: 500, body: 'Error fetching users: ' + err.toString() };
  }
};