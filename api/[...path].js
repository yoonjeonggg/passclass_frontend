export default async function handler(req, res) {
  const pathParts = req.query.path;
  const path = Array.isArray(pathParts) ? pathParts.join('/') : (pathParts || '');

  const queryParams = new URLSearchParams();
  for (const [key, value] of Object.entries(req.query)) {
    if (key !== 'path') {
      if (Array.isArray(value)) {
        value.forEach(v => queryParams.append(key, v));
      } else {
        queryParams.append(key, value);
      }
    }
  }

  const qs = queryParams.toString();
  const backendUrl = `http://52.78.64.228/api/${path}${qs ? `?${qs}` : ''}`;

  const headers = {};
  if (req.headers.authorization) headers['Authorization'] = req.headers.authorization;
  if (req.headers['content-type']) headers['Content-Type'] = req.headers['content-type'];

  const options = { method: req.method, headers };
  if (!['GET', 'HEAD'].includes(req.method) && req.body) {
    options.body = JSON.stringify(req.body);
  }

  try {
    const response = await fetch(backendUrl, options);
    const data = await response.text();
    const ct = response.headers.get('content-type');
    if (ct) res.setHeader('Content-Type', ct);
    res.status(response.status).end(data);
  } catch (err) {
    res.status(500).json({ success: false, message: '서버 연결 실패' });
  }
}
