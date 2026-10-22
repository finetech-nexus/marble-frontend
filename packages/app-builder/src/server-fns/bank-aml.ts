import { authMiddleware } from '@app-builder/middlewares/auth-middleware';
import { getServerEnv } from '@app-builder/utils/environment';
import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod/v4';

const requestSchema = z.object({
  path: z.string().min(1).max(200),
  method: z.enum(['GET', 'POST']),
  body: z.unknown().optional(),
});

export const bankAmlRequestFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator(requestSchema)
  .handler(async ({ context, data }) => {
    if (!data.path.startsWith('/') || data.path.includes('..') || data.path.includes('://')) {
      throw new Error('invalid path');
    }
    const token = await context.authInfo.tokenService.getToken();
    const response = await fetch(`${getServerEnv('MARBLE_API_URL')}/bank-aml${data.path}`, {
      method: data.method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(data.method === 'POST' ? { 'Content-Type': 'application/json' } : {}),
      },
      body: data.method === 'POST' ? JSON.stringify(data.body ?? {}) : undefined,
    });
    const text = await response.text();
    let body: unknown = null;
    if (text) {
      try {
        body = JSON.parse(text);
      } catch {
        body = { error: text };
      }
    }
    return { status: response.status, body };
  });
