// Mock for next-auth
export const getServerSession = jest.fn();
export const getSession = jest.fn();
export const signIn = jest.fn();
export const signOut = jest.fn();
export const useSession = jest.fn();

// Mock the default export
const NextAuth = jest.fn();
export default NextAuth;
