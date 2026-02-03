export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'OPENROUTER_API_KEY is not configured' });
  }

  const endpoint = 'https://openrouter.ai/api/v1/chat/completions';

  try {
    const body = req.body;
    // モデル未指定の場合はデフォルトを使用
    if (!body.model) {
      body.model = process.env.OPENROUTER_MODEL || 'tngtech/deepseek-r1t2-chimera:free';
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': req.headers.referer || req.headers.origin || '',
        'X-Title': 'Coffee Bean Guide'
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      const retryAfter = response.headers.get('retry-after');
      if (retryAfter) {
        res.setHeader('Retry-After', retryAfter);
      }
      return res.status(response.status).json(data);
    }

    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to call OpenRouter API' });
  }
}
