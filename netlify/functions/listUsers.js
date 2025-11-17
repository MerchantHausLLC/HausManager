// Function: listUsers
// Returns a list of users using the NMI v4 API.  Requires the
// `NMI_PARTNER_KEY` environment variable.  This function accepts an
// optional `merchant_id` query parameter (provided via
// event.queryStringParameters.merchant_id) to filter the report to a
// specific merchant.  The response body is returned as plain text.

exports.handler = async function (event, context) {
  const partnerKey = process.env.NMI_PARTNER_KEY;
  if (!partnerKey) {
    return { statusCode: 500, body: 'Missing environment variable: NMI_PARTNER_KEY' };
  }
  // Determine if a merchant_id was provided in query string; if so
  // append it to the endpoint to limit the report.  According to
  // NMI documentation, a merchant_id query parameter can be used
  // when requesting user reports.  If no merchant_id is supplied, a
  // full user report is returned.
  let url = 'https://secure.nmi.com/api/v4/users/reports';
  const qs = event.queryStringParameters || {};
  if (qs.merchant_id) {
    url += `?merchant_id=${encodeURIComponent(qs.merchant_id)}`;
  }
  try {
    const res = await fetch(url, {
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