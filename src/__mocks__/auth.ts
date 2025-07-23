// Mock for auth.ts
export const auth = jest.fn().mockResolvedValue({
  user: {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    role: 'USER',
  },
});

export const signIn = jest.fn();
export const signOut = jest.fn();
export const getSession = jest.fn();
