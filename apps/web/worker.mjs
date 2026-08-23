const API_PREFIX = '/api/';

function jsonError(status, detail, code) {
  return Response.json(
    { code, detail },
    {
      status,
      headers: {
        'Cache-Control': 'no-store',
      },
    }
  );
}

function getAPIOrigin(value) {
  if (!value) return null;

  try {
    const origin = new URL(value);
    if (origin.protocol !== 'https:' && origin.protocol !== 'http:') return null;
    return origin;
  } catch {
    return null;
  }
}

export async function handleRequest(request, env) {
  const incomingURL = new URL(request.url);

  if (!incomingURL.pathname.startsWith(API_PREFIX)) {
    return env.ASSETS.fetch(request);
  }

  const apiOrigin = getAPIOrigin(env.API_ORIGIN);
  if (!apiOrigin) {
    return jsonError(
      503,
      'سرویس ورود در حال حاضر پیکربندی نشده است. لطفاً با پشتیبانی تماس بگیرید.',
      'API_ORIGIN_NOT_CONFIGURED'
    );
  }

  if (apiOrigin.origin === incomingURL.origin) {
    return jsonError(
      503,
      'پیکربندی سرویس ورود نامعتبر است.',
      'API_ORIGIN_LOOP'
    );
  }

  const upstreamURL = new URL(incomingURL.pathname + incomingURL.search, apiOrigin);
  const headers = new Headers(request.headers);
  headers.set('X-Forwarded-Host', incomingURL.host);
  headers.set('X-Forwarded-Proto', incomingURL.protocol.replace(':', ''));

  try {
    const upstreamResponse = await fetch(
      new Request(upstreamURL, {
        method: request.method,
        headers,
        body: request.body,
        redirect: 'manual',
      })
    );
    const response = new Response(upstreamResponse.body, upstreamResponse);
    response.headers.set('Cache-Control', 'no-store');
    return response;
  } catch {
    return jsonError(
      502,
      'ارتباط با سرویس ورود برقرار نشد. لطفاً چند لحظه دیگر دوباره تلاش کنید.',
      'API_UPSTREAM_UNAVAILABLE'
    );
  }
}

export default {
  fetch: handleRequest,
};
