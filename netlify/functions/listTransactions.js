// Function: listTransactions
// Queries transaction reports via the legacy `query.php` endpoint.
// Accepts optional parameters from the JSON body.  Always
// includes the security key and report_type=transaction.  Additional
// query fields (e.g. start_date, end_date) can be supplied.

exports.handler = async function (event, context) {
  const securityKey = process.env.NMI_SECURITY_KEY;
  if (!securityKey) {
    return { statusCode: 500, body: 'Missing environment variable: NMI_SECURITY_KEY' };
  }
  let query = {};
  if (event.body) {
    try {
      query = JSON.parse(event.body);
    } catch (err) {
      return { statusCode: 400, body: 'Invalid JSON: ' + err.toString() };
    }
  }
  const params = new URLSearchParams();
  params.append('security_key', securityKey);
  params.append('report_type', 'transaction');
  for (const key of Object.keys(query)) {
    params.append(key, String(query[key]));
  }
  try {
    const res = await fetch('https://secure.nmi.com/api/query.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });
    const text = await res.text();
    return { statusCode: res.status, body: text };
  } catch (err) {
    return { statusCode: 500, body: 'Error fetching transactions: ' + err.toString() };
  }
};