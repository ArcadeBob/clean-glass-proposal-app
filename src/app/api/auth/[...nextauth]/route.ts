import { handlers } from '@/lib/auth';
import { authRateLimiter } from '@/lib/rate-limiting';
import { NextRequest, NextResponse } from 'next/server';

// Create rate-limited wrappers for NextAuth handlers
async function rateLimitedGET(request: NextRequest) {
  const rateLimit = await authRateLimiter.checkRateLimit(request);

  if (rateLimit.isLimited) {
    return NextResponse.json(
      {
        message: 'Too many authentication attempts',
        retryAfter: rateLimit.retryAfter,
        blockedUntil: rateLimit.blockedUntil,
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': '5',
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          'X-RateLimit-Reset': new Date(rateLimit.resetTime).toISOString(),
          ...(rateLimit.retryAfter && {
            'Retry-After': rateLimit.retryAfter.toString(),
          }),
        },
      }
    );
  }

  const response = await handlers.GET(request);
  const success = response.status < 400;
  await authRateLimiter.recordRequest(request, success);

  // Add rate limit headers
  const headers = new Headers(response.headers);
  headers.set('X-RateLimit-Limit', '5');
  headers.set('X-RateLimit-Remaining', rateLimit.remaining.toString());
  headers.set('X-RateLimit-Reset', new Date(rateLimit.resetTime).toISOString());

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

async function rateLimitedPOST(request: NextRequest) {
  const rateLimit = await authRateLimiter.checkRateLimit(request);

  if (rateLimit.isLimited) {
    return NextResponse.json(
      {
        message: 'Too many authentication attempts',
        retryAfter: rateLimit.retryAfter,
        blockedUntil: rateLimit.blockedUntil,
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': '5',
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          'X-RateLimit-Reset': new Date(rateLimit.resetTime).toISOString(),
          ...(rateLimit.retryAfter && {
            'Retry-After': rateLimit.retryAfter.toString(),
          }),
        },
      }
    );
  }

  const response = await handlers.POST(request);
  const success = response.status < 400;
  await authRateLimiter.recordRequest(request, success);

  // Add rate limit headers
  const headers = new Headers(response.headers);
  headers.set('X-RateLimit-Limit', '5');
  headers.set('X-RateLimit-Remaining', rateLimit.remaining.toString());
  headers.set('X-RateLimit-Reset', new Date(rateLimit.resetTime).toISOString());

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export const GET = rateLimitedGET;
export const POST = rateLimitedPOST;
