import '@testing-library/jest-dom';

// Set up test environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.NEXTAUTH_SECRET = 'test-secret';
process.env.NEXTAUTH_URL = 'http://localhost:3000';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    };
  },
  useSearchParams() {
    return new URLSearchParams();
  },
  usePathname() {
    return '/';
  },
}));

// Mock Next.js image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: props => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} />;
  },
}));

// Mock Next.js link component
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }) => {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  },
}));

// Mock console methods to reduce noise in tests
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is no longer supported')
    ) {
      return;
    }
    originalConsoleError.call(console, ...args);
  };

  console.warn = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning:') || args[0].includes('DeprecationWarning:'))
    ) {
      return;
    }
    originalConsoleWarn.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

// Global test utilities
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock fetch globally
global.fetch = jest.fn();

// Mock crypto for tests
Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: jest.fn(() => new Uint8Array(32)),
    randomUUID: jest.fn(() => 'test-uuid'),
  },
});

// Mock Request global for Next.js API routes
global.Request = class Request {
  constructor(url, options = {}) {
    // Use Object.defineProperty to make url read-only
    Object.defineProperty(this, 'url', {
      value: url,
      writable: false,
      configurable: false,
    });
    this.method = options.method || 'GET';
    this.headers = new Map(Object.entries(options.headers || {}));
    this.body = options.body;
  }

  json() {
    return Promise.resolve(JSON.parse(this.body || '{}'));
  }

  text() {
    return Promise.resolve(this.body || '');
  }
};

// Mock Response global for Next.js API routes
global.Response = class Response {
  constructor(body, options = {}) {
    this.body = body;
    this.status = options.status || 200;
    this.headers = new Map(Object.entries(options.headers || {}));
  }

  json() {
    return Promise.resolve(this.body);
  }

  text() {
    return Promise.resolve(
      typeof this.body === 'string' ? this.body : JSON.stringify(this.body)
    );
  }
};

// Mock NextResponse for Next.js API routes
global.NextResponse = {
  json: jest.fn((data, options = {}) => {
    return new Response(JSON.stringify(data), {
      status: options.status || 200,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
  }),
  redirect: jest.fn((url, options = {}) => {
    return new Response(null, {
      status: options.status || 302,
      headers: {
        Location: url,
        ...options.headers,
      },
    });
  }),
  error: jest.fn((message, options = {}) => {
    return new Response(JSON.stringify({ error: message }), {
      status: options.status || 500,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
  }),
};

// Mock prisma for tests
global.prisma = {
  proposal: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  generalContractor: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  riskCategory: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  user: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  $transaction: jest.fn(),
};
