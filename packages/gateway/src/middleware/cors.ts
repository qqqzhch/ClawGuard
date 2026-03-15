export async function corsMiddleware(c: any, next: any) {
  // Set CORS headers
  c.header('Access-Control-Allow-Origin', '*');
  c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (c.req.method === 'OPTIONS') {
    c.header('Access-Control-Allow-Max-Age', '86400');
    return c.text('', 204);
  }

  await next();
}
