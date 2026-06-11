// Netlify serverless proxy for the Anthropic Messages API.
// The browser calls /.netlify/functions/anthropic instead of api.anthropic.com
// directly, so your API key stays on the server and never ships to the client.
//
// SETUP (one time):
//   In the Netlify dashboard → Site settings → Environment variables,
//   add a variable named  ANTHROPIC_API_KEY  with your key (sk-ant-...).
//   Then redeploy.

exports.handler = async (event) => {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'ANTHROPIC_API_KEY is not set in Netlify environment variables.' }),
    };
  }

  try {
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      // Forward the request body from the browser untouched
      body: event.body,
    });

    const text = await upstream.text();
    return {
      statusCode: upstream.status,
      headers: { 'Content-Type': 'application/json' },
      body: text,
    };
  } catch (err) {
    return {
      statusCode: 502,
      body: JSON.stringify({ error: 'Proxy request failed', detail: String(err) }),
    };
  }
};
