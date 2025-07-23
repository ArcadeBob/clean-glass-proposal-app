// Mock for next/server
export class NextRequest extends Request {
  constructor(url: string, options?: RequestInit) {
    super(url, options);
  }
}

export const NextResponse = {
  json: jest.fn((data: any, options: any = {}) => {
    return new Response(JSON.stringify(data), {
      status: options.status || 200,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
  }),
  redirect: jest.fn((url: string, options: any = {}) => {
    return new Response(null, {
      status: options.status || 302,
      headers: {
        Location: url,
        ...options.headers,
      },
    });
  }),
  error: jest.fn((message: string, options: any = {}) => {
    return new Response(JSON.stringify({ error: message }), {
      status: options.status || 500,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
  }),
};
