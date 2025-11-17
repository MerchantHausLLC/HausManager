// Function: generateMerchantKey
// Generates a new API key for a specific merchant.  The merchant ID
// should be provided via the URL path parameter `merchant_id` or
// within the JSON body as `merchant_id`.  The partner‑level API
// key must be set in `NMI_PARTNER_KEY`.

exports.handler = async function (event, context) {
  const partnerKey = process.env.NMI_PARTNER_KEY;
  if (!partnerKey) {
    return { statusCode: 500, body: 'Missing environment variable: NMI_PARTNER_KEY' };
  }
  let merchantId = null;
  // Try to extract merchant ID from path (e.g. /generateMerchantKey/12345)
  if (event.path) {
    const parts = event.path.split('/').filter(Boolean);
    if (parts.length > 1) {
      merchantId = parts.pop();
    }
  }
  // Fallback to JSON body
  if (!merchantId && event.body) {
    try {
      const body = JSON.parse(event.body);
      merchantId = body.merchant_id;
    } catch (err) {
      // ignore JSON parse error
    }
  }
  if (!merchantId) {
    return { statusCode: 400, body: 'Missing merchant_id in URL or request body' };
  }
  const url = `https://secure.nmi.com/api/v4/merchants/${encodeURIComponent(merchantId)}/api_keys`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: partnerKey },
    });
    const text = await res.text();
    return {
      statusCode: res.status,
      body: text,
    };
  } catch (err) {
    return { statusCode: 500, body: 'Error generating API key: ' + err.toString() };
  }
};