async function probeHomeRoutes() {
  const suffixes = [
    'WebServices', 'WebService', 'ApiKey', 'ApiKeys', 'CreateApiKey', 'Pattern', 'Patterns',
    'RestTracking', 'RestDelivery', 'SampleCodes', 'SampleCode', 'Docs', 'Doc',
    'ReceiveUrl', 'SendUrl', 'UrlForReceive', 'Tracking', 'Rest'
  ];

  for (const s of suffixes) {
    const path = `/Home/${s}`;
    try {
      const res = await fetch(`https://webone-sms.ir${path}`, {
        redirect: 'manual',
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      console.log(path, '=>', res.status, res.headers.get('location') || '');
    } catch(e) {}
  }
}

probeHomeRoutes();
