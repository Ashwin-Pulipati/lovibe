import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { TRPCError } from '@trpc/server';

// Mock external dependencies
jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn(),
}));

jest.mock('react', () => ({
  cache: jest.fn((fn) => fn),
}));

jest.mock('superjson', () => ({
  default: {
    stringify: jest.fn(),
    parse: jest.fn(),
  },
}));

// Import after mocking
import { auth } from '@clerk/nextjs/server';
import { createTRPCContext, baseProcedure, protectedProcedure, createTRPCRouter, createCallerFactory } from './init';

const mockAuth = auth as jest.MockedFunction<typeof auth>;

describe('TRPC Initialization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('createTRPCContext', () => {
    it('should create context with auth data when user is authenticated', async () => {
      const mockAuthData = {
        userId: 'user_123',
        sessionId: 'session_456',
        orgId: 'org_789',
      };
      
      mockAuth.mockResolvedValue(mockAuthData);

      const context = await createTRPCContext();

      expect(context).toEqual({
        auth: mockAuthData,
      });
      expect(mockAuth).toHaveBeenCalledTimes(1);
    });

    it('should create context with null auth when user is not authenticated', async () => {
      const mockAuthData = {
        userId: null,
        sessionId: null,
        orgId: null,
      };
      
      mockAuth.mockResolvedValue(mockAuthData);

      const context = await createTRPCContext();

      expect(context).toEqual({
        auth: mockAuthData,
      });
      expect(mockAuth).toHaveBeenCalledTimes(1);
    });

    it('should handle auth service errors gracefully', async () => {
      const authError = new Error('Auth service unavailable');
      mockAuth.mockRejectedValue(authError);

      await expect(createTRPCContext()).rejects.toThrow('Auth service unavailable');
      expect(mockAuth).toHaveBeenCalledTimes(1);
    });

    it('should return consistent results when called multiple times', async () => {
      const mockAuthData = {
        userId: 'user_123',
        sessionId: 'session_456',
        orgId: 'org_789',
      };
      
      mockAuth.mockResolvedValue(mockAuthData);

      const context1 = await createTRPCContext();
      const context2 = await createTRPCContext();

      expect(context1).toEqual(context2);
    });

    it('should handle partial auth data', async () => {
      const partialAuthData = {
        userId: 'user_123',
        sessionId: null,
        orgId: undefined,
      };
      
      mockAuth.mockResolvedValue(partialAuthData);

      const context = await createTRPCContext();

      expect(context).toEqual({
        auth: partialAuthData,
      });
    });

    it('should handle completely null auth response', async () => {
      mockAuth.mockResolvedValue(null as any);

      const context = await createTRPCContext();

      expect(context).toEqual({
        auth: null,
      });
    });
  });

  describe('baseProcedure', () => {
    it('should be defined and have expected methods', () => {
      expect(baseProcedure).toBeDefined();
      expect(typeof baseProcedure.query).toBe('function');
      expect(typeof baseProcedure.mutation).toBe('function');
      expect(typeof baseProcedure.use).toBe('function');
    });

    it('should allow creating queries without authentication requirements', () => {
      const testQuery = baseProcedure.query(async ({ ctx }) => {
        return { message: 'Hello World', hasAuth: !!ctx.auth?.userId };
      });

      expect(testQuery).toBeDefined();
      expect(testQuery._def).toBeDefined();
      expect(testQuery._def.type).toBe('query');
    });

    it('should allow creating mutations without authentication requirements', () => {
      const testMutation = baseProcedure.mutation(async ({ ctx }) => {
        return { success: true, hasAuth: !!ctx.auth?.userId };
      });

      expect(testMutation).toBeDefined();
      expect(testMutation._def).toBeDefined();
      expect(testMutation._def.type).toBe('mutation');
    });

    it('should work with input validation', () => {
      const testQuery = baseProcedure
        .input((val: unknown) => {
          if (typeof val === 'string') return val;
          throw new Error('Expected string');
        })
        .query(async ({ input }) => {
          return { input };
        });

      expect(testQuery).toBeDefined();
      expect(testQuery._def.inputs).toHaveLength(1);
    });
  });

  describe('protectedProcedure', () => {
    it('should be defined and have expected methods', () => {
      expect(protectedProcedure).toBeDefined();
      expect(typeof protectedProcedure.query).toBe('function');
      expect(typeof protectedProcedure.mutation).toBe('function');
      expect(protectedProcedure._def.middlewares).toHaveLength(1);
    });

    it('should have authentication middleware attached', () => {
      const middleware = protectedProcedure._def.middlewares[0];
      expect(middleware).toBeDefined();
      expect(typeof middleware._def.fn).toBe('function');
    });

    it('should allow authenticated users through middleware', async () => {
      const mockAuthData = {
        userId: 'user_123',
        sessionId: 'session_456',
        orgId: 'org_789',
      };
      
      mockAuth.mockResolvedValue(mockAuthData);
      const context = await createTRPCContext();

      const mockNext = jest.fn().mockReturnValue({ success: true });
      const middleware = protectedProcedure._def.middlewares[0];

      const result = middleware._def.fn({ ctx: context, next: mockNext });

      expect(mockNext).toHaveBeenCalledWith({
        ctx: {
          auth: mockAuthData,
        },
      });
      expect(result).toEqual({ success: true });
    });

    it('should reject unauthenticated users with UNAUTHORIZED error', async () => {
      const mockAuthData = {
        userId: null,
        sessionId: null,
        orgId: null,
      };
      
      mockAuth.mockResolvedValue(mockAuthData);
      const context = await createTRPCContext();

      const mockNext = jest.fn();
      const middleware = protectedProcedure._def.middlewares[0];

      expect(() => {
        middleware._def.fn({ ctx: context, next: mockNext });
      }).toThrow('Not authenticated');

      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should throw TRPCError with correct error code for unauthorized access', async () => {
      const mockAuthData = {
        userId: null,
        sessionId: null,
        orgId: null,
      };
      
      mockAuth.mockResolvedValue(mockAuthData);
      const context = await createTRPCContext();

      const mockNext = jest.fn();
      const middleware = protectedProcedure._def.middlewares[0];

      let thrownError;
      try {
        middleware._def.fn({ ctx: context, next: mockNext });
      } catch (error) {
        thrownError = error;
      }

      expect(thrownError).toBeInstanceOf(TRPCError);
      expect(thrownError.code).toBe('UNAUTHORIZED');
      expect(thrownError.message).toBe('Not authenticated');
    });

    it('should create protected queries and mutations', () => {
      const protectedQuery = protectedProcedure.query(async ({ ctx }) => {
        return { userId: ctx.auth.userId };
      });

      const protectedMutation = protectedProcedure.mutation(async ({ ctx }) => {
        return { success: true, userId: ctx.auth.userId };
      });

      expect(protectedQuery._def.type).toBe('query');
      expect(protectedMutation._def.type).toBe('mutation');
      expect(protectedQuery._def.middlewares).toHaveLength(1);
      expect(protectedMutation._def.middlewares).toHaveLength(1);
    });
  });

  describe('middleware authentication logic edge cases', () => {
    it('should handle undefined auth object', async () => {
      mockAuth.mockResolvedValue(undefined as any);
      const context = await createTRPCContext();

      const mockNext = jest.fn();
      const middleware = protectedProcedure._def.middlewares[0];

      expect(() => {
        middleware._def.fn({ ctx: context, next: mockNext });
      }).toThrow(TRPCError);

      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle auth with empty string userId', async () => {
      const mockAuthData = {
        userId: '',
        sessionId: 'session_456',
        orgId: 'org_789',
      };
      
      mockAuth.mockResolvedValue(mockAuthData);
      const context = await createTRPCContext();

      const mockNext = jest.fn();
      const middleware = protectedProcedure._def.middlewares[0];

      expect(() => {
        middleware._def.fn({ ctx: context, next: mockNext });
      }).toThrow(TRPCError);

      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle auth with zero as userId (falsy value)', async () => {
      const mockAuthData = {
        userId: 0 as any,
        sessionId: 'session_456',
        orgId: 'org_789',
      };
      
      mockAuth.mockResolvedValue(mockAuthData);
      const context = await createTRPCContext();

      const mockNext = jest.fn();
      const middleware = protectedProcedure._def.middlewares[0];

      expect(() => {
        middleware._def.fn({ ctx: context, next: mockNext });
      }).toThrow(TRPCError);

      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle auth with false as userId', async () => {
      const mockAuthData = {
        userId: false as any,
        sessionId: 'session_456',
        orgId: 'org_789',
      };
      
      mockAuth.mockResolvedValue(mockAuthData);
      const context = await createTRPCContext();

      const mockNext = jest.fn();
      const middleware = protectedProcedure._def.middlewares[0];

      expect(() => {
        middleware._def.fn({ ctx: context, next: mockNext });
      }).toThrow(TRPCError);

      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should accept truthy non-string userId values', async () => {
      const mockAuthData = {
        userId: 123 as any,
        sessionId: 'session_456',
        orgId: 'org_789',
      };
      
      mockAuth.mockResolvedValue(mockAuthData);
      const context = await createTRPCContext();

      const mockNext = jest.fn().mockReturnValue({ success: true });
      const middleware = protectedProcedure._def.middlewares[0];

      const result = middleware._def.fn({ ctx: context, next: mockNext });

      expect(mockNext).toHaveBeenCalledWith({
        ctx: {
          auth: mockAuthData,
        },
      });
      expect(result).toEqual({ success: true });
    });

    it('should handle auth context without userId property', async () => {
      const mockAuthData = {
        sessionId: 'session_456',
        orgId: 'org_789',
      } as any;
      
      mockAuth.mockResolvedValue(mockAuthData);
      const context = await createTRPCContext();

      const mockNext = jest.fn();
      const middleware = protectedProcedure._def.middlewares[0];

      expect(() => {
        middleware._def.fn({ ctx: context, next: mockNext });
      }).toThrow(TRPCError);

      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle completely null context auth', async () => {
      mockAuth.mockResolvedValue(null as any);
      const context = await createTRPCContext();

      const mockNext = jest.fn();
      const middleware = protectedProcedure._def.middlewares[0];

      expect(() => {
        middleware._def.fn({ ctx: context, next: mockNext });
      }).toThrow(TRPCError);

      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('TRPC router and factory exports', () => {
    it('should export createTRPCRouter function', () => {
      expect(createTRPCRouter).toBeDefined();
      expect(typeof createTRPCRouter).toBe('function');
    });

    it('should export createCallerFactory function', () => {
      expect(createCallerFactory).toBeDefined();
      expect(typeof createCallerFactory).toBe('function');
    });

    it('should create a valid router using createTRPCRouter', () => {
      const testRouter = createTRPCRouter({
        hello: baseProcedure.query(() => 'Hello World'),
        protected: protectedProcedure.query(() => 'Protected Hello'),
      });

      expect(testRouter).toBeDefined();
      expect(testRouter._def).toBeDefined();
      expect(testRouter._def.procedures).toHaveProperty('hello');
      expect(testRouter._def.procedures).toHaveProperty('protected');
    });

    it('should create router with mixed procedure types', () => {
      const testRouter = createTRPCRouter({
        publicQuery: baseProcedure.query(() => 'Public data'),
        publicMutation: baseProcedure.mutation(() => ({ success: true })),
        protectedQuery: protectedProcedure.query(() => 'Protected data'),
        protectedMutation: protectedProcedure.mutation(() => ({ success: true })),
      });

      expect(testRouter._def.procedures).toHaveProperty('publicQuery');
      expect(testRouter._def.procedures).toHaveProperty('publicMutation');
      expect(testRouter._def.procedures).toHaveProperty('protectedQuery');
      expect(testRouter._def.procedures).toHaveProperty('protectedMutation');
    });

    it('should create nested routers', () => {
      const nestedRouter = createTRPCRouter({
        nested: createTRPCRouter({
          hello: baseProcedure.query(() => 'Nested Hello'),
        }),
        root: baseProcedure.query(() => 'Root Hello'),
      });

      expect(nestedRouter._def.procedures).toHaveProperty('nested');
      expect(nestedRouter._def.procedures).toHaveProperty('root');
    });

    it('should create a valid caller using createCallerFactory', () => {
      const testRouter = createTRPCRouter({
        hello: baseProcedure.query(() => 'Hello World'),
      });

      const createCaller = createCallerFactory(testRouter);
      expect(createCaller).toBeDefined();
      expect(typeof createCaller).toBe('function');
    });

    it('should handle empty router creation', () => {
      const emptyRouter = createTRPCRouter({});

      expect(emptyRouter).toBeDefined();
      expect(emptyRouter._def).toBeDefined();
      expect(Object.keys(emptyRouter._def.procedures)).toHaveLength(0);
    });

    it('should handle router with only protected procedures', () => {
      const protectedOnlyRouter = createTRPCRouter({
        protected1: protectedProcedure.query(() => 'Protected 1'),
        protected2: protectedProcedure.mutation(() => ({ success: true })),
      });

      expect(protectedOnlyRouter._def.procedures).toHaveProperty('protected1');
      expect(protectedOnlyRouter._def.procedures).toHaveProperty('protected2');
      expect(Object.keys(protectedOnlyRouter._def.procedures)).toHaveLength(2);
    });
  });

  describe('SuperJSON transformer integration', () => {
    it('should be configured to use SuperJSON transformer', () => {
      // Test router creation with complex data types that require SuperJSON
      const testRouter = createTRPCRouter({
        dateTest: baseProcedure.query(() => new Date('2023-01-01')),
        mapTest: baseProcedure.query(() => new Map([['key', 'value']])),
        setTest: baseProcedure.query(() => new Set([1, 2, 3])),
        bigIntTest: baseProcedure.query(() => BigInt(123)),
        undefinedTest: baseProcedure.query(() => undefined),
        regexTest: baseProcedure.query(() => /test/gi),
      });

      expect(testRouter).toBeDefined();
      // The transformer configuration is internal to TRPC
      // but we can verify the router accepts procedures that return complex types
      expect(testRouter._def.procedures.dateTest).toBeDefined();
      expect(testRouter._def.procedures.mapTest).toBeDefined();
      expect(testRouter._def.procedures.setTest).toBeDefined();
      expect(testRouter._def.procedures.bigIntTest).toBeDefined();
      expect(testRouter._def.procedures.undefinedTest).toBeDefined();
      expect(testRouter._def.procedures.regexTest).toBeDefined();
    });

    it('should handle procedures returning nested complex objects', () => {
      const complexRouter = createTRPCRouter({
        complexData: baseProcedure.query(() => ({
          date: new Date(),
          map: new Map([['nested', new Set([1, 2, 3])]]),
          array: [new Date(), new Map(), new Set()],
        })),
      });

      expect(complexRouter._def.procedures.complexData).toBeDefined();
    });
  });

  describe('error handling and resilience', () => {
    it('should handle context creation with malformed auth response', async () => {
      const malformedAuth = { someOtherProperty: 'value' } as any;
      mockAuth.mockResolvedValue(malformedAuth);

      const context = await createTRPCContext();

      expect(context).toEqual({
        auth: malformedAuth,
      });
    });

    it('should handle async errors in auth middleware chain', async () => {
      const mockAuthData = {
        userId: 'user_123',
        sessionId: 'session_456',
        orgId: 'org_789',
      };
      
      mockAuth.mockResolvedValue(mockAuthData);
      const context = await createTRPCContext();

      const mockNext = jest.fn().mockImplementation(() => {
        throw new Error('Downstream middleware error');
      });
      const middleware = protectedProcedure._def.middlewares[0];

      expect(() => {
        middleware._def.fn({ ctx: context, next: mockNext });
      }).toThrow('Downstream middleware error');

      expect(mockNext).toHaveBeenCalledWith({
        ctx: {
          auth: mockAuthData,
        },
      });
    });

    it('should handle null context gracefully', async () => {
      const mockNext = jest.fn();
      const middleware = protectedProcedure._def.middlewares[0];

      expect(() => {
        middleware._def.fn({ ctx: null as any, next: mockNext });
      }).toThrow();

      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle Promise rejection in auth', async () => {
      const authError = new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Auth system failure',
      });
      
      mockAuth.mockRejectedValue(authError);

      await expect(createTRPCContext()).rejects.toThrow('Auth system failure');
    });

    it('should handle timeout scenarios in auth', async () => {
      const timeoutError = new Error('Request timeout');
      mockAuth.mockRejectedValue(timeoutError);

      await expect(createTRPCContext()).rejects.toThrow('Request timeout');
    });
  });

  describe('type safety and context preservation', () => {
    it('should preserve auth context through middleware chain', async () => {
      const mockAuthData = {
        userId: 'user_123',
        sessionId: 'session_456',
        orgId: 'org_789',
        orgRole: 'admin',
        metadata: { plan: 'premium' },
      };
      
      mockAuth.mockResolvedValue(mockAuthData);
      const context = await createTRPCContext();

      const mockNext = jest.fn((args) => {
        // Verify that the auth context is properly passed through
        expect(args.ctx.auth).toEqual(mockAuthData);
        return { processedAuth: args.ctx.auth };
      });
      
      const middleware = protectedProcedure._def.middlewares[0];
      const result = middleware._def.fn({ ctx: context, next: mockNext });

      expect(result).toEqual({ processedAuth: mockAuthData });
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should maintain context structure after middleware processing', async () => {
      const mockAuthData = {
        userId: 'user_123',
        sessionId: 'session_456',
        orgId: 'org_789',
      };
      
      mockAuth.mockResolvedValue(mockAuthData);
      const context = await createTRPCContext();

      const mockNext = jest.fn((args) => {
        // Verify context structure
        expect(args.ctx).toHaveProperty('auth');
        expect(args.ctx.auth).toEqual(mockAuthData);
        return args;
      });
      
      const middleware = protectedProcedure._def.middlewares[0];
      middleware._def.fn({ ctx: context, next: mockNext });

      expect(mockNext).toHaveBeenCalledWith({
        ctx: {
          auth: mockAuthData,
        },
      });
    });

    it('should handle context with additional properties', async () => {
      const mockAuthData = {
        userId: 'user_123',
        sessionId: 'session_456',
        orgId: 'org_789',
        customProperty: 'custom_value',
        permissions: ['read', 'write', 'admin'],
      };
      
      mockAuth.mockResolvedValue(mockAuthData);
      const context = await createTRPCContext();

      const mockNext = jest.fn((args) => {
        expect(args.ctx.auth.customProperty).toBe('custom_value');
        expect(args.ctx.auth.permissions).toEqual(['read', 'write', 'admin']);
        return { success: true };
      });
      
      const middleware = protectedProcedure._def.middlewares[0];
      const result = middleware._def.fn({ ctx: context, next: mockNext });

      expect(result).toEqual({ success: true });
    });
  });

  describe('procedure creation and configuration', () => {
    it('should create procedures with proper type definitions', () => {
      const queryProcedure = baseProcedure.query(async () => 'test');
      const mutationProcedure = baseProcedure.mutation(async () => ({ success: true }));

      expect(queryProcedure._def.type).toBe('query');
      expect(mutationProcedure._def.type).toBe('mutation');
    });

    it('should allow chaining middleware on procedures', () => {
      const customMiddleware = baseProcedure.use(({ next }) => next());
      const chainedProcedure = customMiddleware.use(({ next }) => next());

      expect(customMiddleware._def.middlewares).toHaveLength(1);
      expect(chainedProcedure._def.middlewares).toHaveLength(2);
    });

    it('should preserve middleware order in protected procedures', () => {
      const additionalMiddleware = protectedProcedure.use(({ next }) => next());

      expect(additionalMiddleware._def.middlewares).toHaveLength(2);
      // First middleware should be the auth middleware
      // Second should be the additional one
    });

    it('should create subscription procedures', () => {
      const subscriptionProcedure = baseProcedure.subscription(() => {
        // Mock subscription implementation
        return {
          subscribe: () => ({ unsubscribe: () => {} }),
        } as any;
      });

      expect(subscriptionProcedure._def.type).toBe('subscription');
    });
  });

  describe('authentication scenarios', () => {
    it('should handle different user ID formats', async () => {
      const testCases = [
        'user_123',
        '123456789',
        'auth0|507f1f77bcf86cd799439011',
        'google-oauth2|108204268033311374519',
        'clerk_user_abcdef123456',
      ];

      for (const userId of testCases) {
        const mockAuthData = { userId, sessionId: 'session', orgId: 'org' };
        mockAuth.mockResolvedValue(mockAuthData);
        const context = await createTRPCContext();

        const mockNext = jest.fn().mockReturnValue({ success: true });
        const middleware = protectedProcedure._def.middlewares[0];

        const result = middleware._def.fn({ ctx: context, next: mockNext });

        expect(mockNext).toHaveBeenCalledWith({
          ctx: { auth: mockAuthData },
        });
        expect(result).toEqual({ success: true });

        jest.clearAllMocks();
      }
    });

    it('should handle organization-specific authentication', async () => {
      const mockAuthData = {
        userId: 'user_123',
        sessionId: 'session_456',
        orgId: 'org_789',
        orgRole: 'member',
        orgPermissions: ['read', 'write'],
      };
      
      mockAuth.mockResolvedValue(mockAuthData);
      const context = await createTRPCContext();

      const mockNext = jest.fn((args) => {
        expect(args.ctx.auth.orgId).toBe('org_789');
        expect(args.ctx.auth.orgRole).toBe('member');
        return { authenticated: true };
      });
      
      const middleware = protectedProcedure._def.middlewares[0];
      const result = middleware._def.fn({ ctx: context, next: mockNext });

      expect(result).toEqual({ authenticated: true });
    });

    it('should handle multi-organization scenarios', async () => {
      const mockAuthData = {
        userId: 'user_123',
        sessionId: 'session_456',
        orgId: 'org_primary',
        orgRole: 'admin',
        orgMemberships: [
          { orgId: 'org_primary', role: 'admin' },
          { orgId: 'org_secondary', role: 'member' },
        ],
      };
      
      mockAuth.mockResolvedValue(mockAuthData);
      const context = await createTRPCContext();

      const mockNext = jest.fn((args) => {
        expect(args.ctx.auth.orgMemberships).toHaveLength(2);
        expect(args.ctx.auth.orgMemberships[0].role).toBe('admin');
        return { success: true };
      });
      
      const middleware = protectedProcedure._def.middlewares[0];
      const result = middleware._def.fn({ ctx: context, next: mockNext });

      expect(result).toEqual({ success: true });
    });
  });

  describe('React cache integration', () => {
    it('should utilize React cache wrapper for context creation', async () => {
      const mockAuthData = { userId: 'user_123' };
      mockAuth.mockResolvedValue(mockAuthData);

      // Verify that the cache function from React is being used
      const { cache } = require('react');
      expect(cache).toHaveBeenCalled();
    });
  });
});