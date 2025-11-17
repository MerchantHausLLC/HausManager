// Function: listCommission
// Retrieves commission reports via the NMI v4 API.  Requires the
// partner API key in `NMI_PARTNER_KEY`.

exports.handler = async function (event, context) {
  const partnerKey = process.env.NMI_PARTNER_KEY;
  if (!partnerKey) {
    return { statusCode: 500, body: 'Missing environment variable: NMI_PARTNER_KEY' };
  }
  try {
    const res = await fetch('https://secure.nmi.com/api/v4/billing/commission/reports', {
      method: 'GET',
      headers: { Authorization: partnerKey },
    });
    const body = await res.text();
    return {
      statusCode: res.status,
      body,
    };
  } catch (err) {
    return { statusCode: 500, body: 'Error fetching commission reports: ' + err.toString() };
  }
};