// Function: listBilling
// Retrieves billing reports for merchants via the NMI v4 API.
// Requires the partner API key in `NMI_PARTNER_KEY`.  Returns
// whatever body the NMI API responds with (JSON or text).

exports.handler = async function (event, context) {
  const partnerKey = process.env.NMI_PARTNER_KEY;
  if (!partnerKey) {
    return { statusCode: 500, body: 'Missing environment variable: NMI_PARTNER_KEY' };
  }
  try {
    const res = await fetch('https://secure.nmi.com/api/v4/billing/reports', {
      method: 'GET',
      headers: { Authorization: partnerKey },
    });
    const body = await res.text();
    return {
      statusCode: res.status,
      body,
    };
  } catch (err) {
    return { statusCode: 500, body: 'Error fetching billing reports: ' + err.toString() };
  }
};