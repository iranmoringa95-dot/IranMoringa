import assert from 'node:assert/strict';
import test from 'node:test';

import { handleRequest } from './worker.mjs';

test('API routes return JSON when API_ORIGIN is missing', async () => {
  const response = await handleRequest(
    new Request('https://store.example/api/v1/auth/otp/request', { method: 'POST' }),
    { ASSETS: { fetch: () => assert.fail('API request must not reach static assets') } }
  );

  assert.equal(response.status, 503);
  assert.match(response.headers.get('content-type') || '', /application\/json/);
  const body = await response.json();
  assert.equal(body.code, 'API_ORIGIN_NOT_CONFIGURED');
});

test('non-API routes are served by the static asset binding', async () => {
  const response = await handleRequest(
    new Request('https://store.example/login'),
    {
      ASSETS: {
        fetch: () => new Response('asset response', { status: 200 }),
      },
    }
  );

  assert.equal(response.status, 200);
  assert.equal(await response.text(), 'asset response');
});

test('API routes are proxied to the configured Go origin', async () => {
  const originalFetch = globalThis.fetch;
  let proxiedURL = '';

  globalThis.fetch = async (request) => {
    proxiedURL = request.url;
    return Response.json({ status: 'success' });
  };

  try {
    const response = await handleRequest(
      new Request('https://store.example/api/v1/auth/otp/request?source=test'),
      {
        API_ORIGIN: 'https://api.example',
        ASSETS: { fetch: () => assert.fail('API request must not reach static assets') },
      }
    );

    assert.equal(proxiedURL, 'https://api.example/api/v1/auth/otp/request?source=test');
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('cache-control'), 'no-store');
  } finally {
    globalThis.fetch = originalFetch;
  }
});
