// Function: getTokenizationKey
// Returns the Collect.js tokenisation key configured via the
// environment variable `NMI_TOKENIZATION_KEY`.  This key is used
// client‑side to load the Collect.js library.  Tokenisation keys are
// considered safe to expose to the client because they only allow
// token creation and cannot be used to authorise payments directly.

exports.handler = async function () {
  const key = process.env.NMI_TOKENIZATION_KEY || '';
  return {
    statusCode: key ? 200 : 404,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key }),
  };
};