// Mock hono/cors module
export const cors = (options = {}) => {
  return async (c: any, next: any) => {
    // Apply CORS headers
    if (c.req.method === 'OPTIONS') {
      c.header('Access-Control-Allow-Origin', options.origin || '*');
      c.header('Access-Control-Allow-Methods', options.allowMethods?.join(', ') || 'GET, POST, PUT, DELETE, OPTIONS');
      c.header('Access-Control-Allow-Headers', options.allowHeaders?.join(', ') || 'Content-Type, Authorization');

      return new Response(null, { status: 204, headers: c.res.headers });
    }

    await next();
  };
};
