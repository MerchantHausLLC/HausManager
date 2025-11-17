// Function: listMerchants
// Returns a list of merchants using the NMI v4 API.  This function
// expects that the partner‑level API key is stored in the environment
// variable `NMI_PARTNER_KEY`.  The response body is returned as
// plain text to preserve whatever structure NMI returns (JSON or
// error text).

exports.handler = async function (event, context) {
  const partnerKey = process.env.NMI_PARTNER_KEY;
  if (!partnerKey) {
    return {
      statusCode: 500,
      body: 'Missing environment variable: NMI_PARTNER_KEY',
    };
  }
  try {
    const res = await fetch('https://secure.nmi.com/api/v4/merchants/reports', {
      method: 'GET',
      headers: { Authorization: partnerKey },
    });
    const body = await res.text();
    return {
      statusCode: res.status,
      body,
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: 'Error fetching merchants: ' + err.toString(),
    };
  }
};