import { describe, it, expect, beforeEach, vi, MockedFunction } from 'vitest';
import { PrismaClient } from '@/generated/prisma';
import { inngest } from '@/inngest/client';
import { TRPCError } from '@trpc/server';
import { messageRouter } from './procedures';

// Mock the dependencies
vi.mock('@/generated/prisma');
vi.mock('@/inngest/client');

const mockPrisma = {
  message: {
    findMany: vi.fn(),
    create: vi.fn(),
  },
  project: {
    findUnique: vi.fn(),
  },
} as unknown as PrismaClient;

const mockInngest = {
  send: vi.fn(),
};

// Mock the PrismaClient constructor and inngest
vi.mocked(PrismaClient).mockImplementation(() => mockPrisma);
(inngest as any).send = mockInngest.send;

const mockContext = {
  auth: {
    userId: 'test-user-id',
  },
};

describe('messageRouter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getMany procedure', () => {
    const validInput = {
      projectId: 'test-project-id',
    };

    it('should successfully fetch messages for a valid project', async () => {
      const mockMessages = [
        {
          id: 'message-1',
          content: 'Test message 1',
          projectId: 'test-project-id',
          role: 'USER',
          type: 'RESULT',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
          fragment: null,
        },
        {
          id: 'message-2',
          content: 'Test message 2',
          projectId: 'test-project-id',
          role: 'ASSISTANT',
          type: 'RESPONSE',
          createdAt: new Date('2024-01-02'),
          updatedAt: new Date('2024-01-02'),
          fragment: { id: 'fragment-1', content: 'Fragment content' },
        },
      ];

      (mockPrisma.message.findMany as MockedFunction<any>).mockResolvedValue(mockMessages);

      const caller = messageRouter.createCaller(mockContext);
      const result = await caller.getMany(validInput);

      expect(mockPrisma.message.findMany).toHaveBeenCalledWith({
        where: {
          projectId: 'test-project-id',
          project: {
            userId: 'test-user-id',
          },
        },
        orderBy: {
          updatedAt: 'asc',
        },
        include: {
          fragment: true,
        },
      });

      expect(result).toEqual(mockMessages);
    });

    it('should return empty array when no messages found', async () => {
      (mockPrisma.message.findMany as MockedFunction<any>).mockResolvedValue([]);

      const caller = messageRouter.createCaller(mockContext);
      const result = await caller.getMany(validInput);

      expect(result).toEqual([]);
      expect(mockPrisma.message.findMany).toHaveBeenCalledTimes(1);
    });

    it('should validate input and reject empty projectId', async () => {
      const invalidInput = { projectId: '' };

      const caller = messageRouter.createCaller(mockContext);
      await expect(caller.getMany(invalidInput)).rejects.toThrow();
    });

    it('should validate input and reject missing projectId', async () => {
      const invalidInput = {} as any;

      const caller = messageRouter.createCaller(mockContext);
      await expect(caller.getMany(invalidInput)).rejects.toThrow();
    });

    it('should handle database errors gracefully', async () => {
      (mockPrisma.message.findMany as MockedFunction<any>).mockRejectedValue(
        new Error('Database connection failed')
      );

      const caller = messageRouter.createCaller(mockContext);
      await expect(caller.getMany(validInput)).rejects.toThrow('Database connection failed');
    });

    it('should properly filter messages by user context', async () => {
      const differentUserContext = {
        auth: { userId: 'different-user-id' },
      };

      (mockPrisma.message.findMany as MockedFunction<any>).mockResolvedValue([]);

      const caller = messageRouter.createCaller(differentUserContext);
      await caller.getMany(validInput);

      expect(mockPrisma.message.findMany).toHaveBeenCalledWith({
        where: {
          projectId: 'test-project-id',
          project: {
            userId: 'different-user-id',
          },
        },
        orderBy: {
          updatedAt: 'asc',
        },
        include: {
          fragment: true,
        },
      });
    });

    it('should handle large number of messages efficiently', async () => {
      const largeMessageSet = Array.from({ length: 1000 }, (_, i) => ({
        id: `message-${i}`,
        content: `Test message ${i}`,
        projectId: 'test-project-id',
        role: 'USER',
        type: 'RESULT',
        createdAt: new Date(`2024-01-${String(i % 28 + 1).padStart(2, '0')}`),
        updatedAt: new Date(`2024-01-${String(i % 28 + 1).padStart(2, '0')}`),
        fragment: null,
      }));

      (mockPrisma.message.findMany as MockedFunction<any>).mockResolvedValue(largeMessageSet);

      const caller = messageRouter.createCaller(mockContext);
      const result = await caller.getMany(validInput);

      expect(result).toHaveLength(1000);
      expect(mockPrisma.message.findMany).toHaveBeenCalledTimes(1);
    });

    it('should handle messages with fragments correctly', async () => {
      const messagesWithFragments = [
        {
          id: 'message-1',
          content: 'Message with fragment',
          projectId: 'test-project-id',
          role: 'USER',
          type: 'RESULT',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
          fragment: {
            id: 'fragment-1',
            content: 'Fragment content',
            messageId: 'message-1',
          },
        },
      ];

      (mockPrisma.message.findMany as MockedFunction<any>).mockResolvedValue(messagesWithFragments);

      const caller = messageRouter.createCaller(mockContext);
      const result = await caller.getMany(validInput);

      expect(result[0].fragment).toBeDefined();
      expect(result[0].fragment.content).toBe('Fragment content');
    });
  });

  describe('create procedure', () => {
    const validInput = {
      value: 'Test message content',
      projectId: 'test-project-id',
    };

    const mockProject = {
      id: 'test-project-id',
      userId: 'test-user-id',
      name: 'Test Project',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    };

    const mockCreatedMessage = {
      id: 'new-message-id',
      content: 'Test message content',
      projectId: 'test-project-id',
      role: 'USER',
      type: 'RESULT',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    };

    beforeEach(() => {
      (mockPrisma.project.findUnique as MockedFunction<any>).mockResolvedValue(mockProject);
      (mockPrisma.message.create as MockedFunction<any>).mockResolvedValue(mockCreatedMessage);
      (mockInngest.send as MockedFunction<any>).mockResolvedValue(undefined);
    });

    it('should successfully create a message for valid input', async () => {
      const caller = messageRouter.createCaller(mockContext);
      const result = await caller.create(validInput);

      expect(mockPrisma.project.findUnique).toHaveBeenCalledWith({
        where: {
          id: 'test-project-id',
          userId: 'test-user-id',
        },
      });

      expect(mockPrisma.message.create).toHaveBeenCalledWith({
        data: {
          projectId: 'test-project-id',
          content: 'Test message content',
          role: 'USER',
          type: 'RESULT',
        },
      });

      expect(mockInngest.send).toHaveBeenCalledWith({
        name: 'code-agent/run',
        data: {
          value: 'Test message content',
          projectId: 'test-project-id',
        },
      });

      expect(result).toEqual(mockCreatedMessage);
    });

    it('should throw NOT_FOUND error when project does not exist', async () => {
      (mockPrisma.project.findUnique as MockedFunction<any>).mockResolvedValue(null);

      const caller = messageRouter.createCaller(mockContext);
      
      const createPromise = caller.create(validInput);
      await expect(createPromise).rejects.toThrow(TRPCError);
      
      try {
        await createPromise;
      } catch (error) {
        expect(error).toBeInstanceOf(TRPCError);
        expect((error as TRPCError).code).toBe('NOT_FOUND');
        expect((error as TRPCError).message).toBe('Project not found');
      }

      expect(mockPrisma.message.create).not.toHaveBeenCalled();
      expect(mockInngest.send).not.toHaveBeenCalled();
    });

    it('should throw NOT_FOUND error when project belongs to different user', async () => {
      (mockPrisma.project.findUnique as MockedFunction<any>).mockResolvedValue(null);

      const caller = messageRouter.createCaller(mockContext);
      await expect(caller.create(validInput)).rejects.toThrow(TRPCError);

      expect(mockPrisma.message.create).not.toHaveBeenCalled();
      expect(mockInngest.send).not.toHaveBeenCalled();
    });

    it('should validate input and reject empty value', async () => {
      const invalidInput = {
        value: '',
        projectId: 'test-project-id',
      };

      const caller = messageRouter.createCaller(mockContext);
      await expect(caller.create(invalidInput)).rejects.toThrow();

      expect(mockPrisma.project.findUnique).not.toHaveBeenCalled();
    });

    it('should validate input and reject value exceeding max length', async () => {
      const longValue = 'a'.repeat(10001);
      const invalidInput = {
        value: longValue,
        projectId: 'test-project-id',
      };

      const caller = messageRouter.createCaller(mockContext);
      await expect(caller.create(invalidInput)).rejects.toThrow();

      expect(mockPrisma.project.findUnique).not.toHaveBeenCalled();
    });

    it('should validate input and reject empty projectId', async () => {
      const invalidInput = {
        value: 'Test message',
        projectId: '',
      };

      const caller = messageRouter.createCaller(mockContext);
      await expect(caller.create(invalidInput)).rejects.toThrow();

      expect(mockPrisma.project.findUnique).not.toHaveBeenCalled();
    });

    it('should validate input and reject missing required fields', async () => {
      const invalidInput = {} as any;

      const caller = messageRouter.createCaller(mockContext);
      await expect(caller.create(invalidInput)).rejects.toThrow();

      expect(mockPrisma.project.findUnique).not.toHaveBeenCalled();
    });

    it('should handle value at maximum allowed length', async () => {
      const maxLengthValue = 'a'.repeat(10000);
      const inputWithMaxLength = {
        value: maxLengthValue,
        projectId: 'test-project-id',
      };

      const caller = messageRouter.createCaller(mockContext);
      const result = await caller.create(inputWithMaxLength);

      expect(mockPrisma.message.create).toHaveBeenCalledWith({
        data: {
          projectId: 'test-project-id',
          content: maxLengthValue,
          role: 'USER',
          type: 'RESULT',
        },
      });

      expect(result).toEqual(mockCreatedMessage);
    });

    it('should handle database error during project lookup', async () => {
      (mockPrisma.project.findUnique as MockedFunction<any>).mockRejectedValue(new Error('Database error'));

      const caller = messageRouter.createCaller(mockContext);
      await expect(caller.create(validInput)).rejects.toThrow('Database error');

      expect(mockPrisma.message.create).not.toHaveBeenCalled();
      expect(mockInngest.send).not.toHaveBeenCalled();
    });

    it('should handle database error during message creation', async () => {
      (mockPrisma.message.create as MockedFunction<any>).mockRejectedValue(
        new Error('Message creation failed')
      );

      const caller = messageRouter.createCaller(mockContext);
      await expect(caller.create(validInput)).rejects.toThrow('Message creation failed');

      expect(mockPrisma.project.findUnique).toHaveBeenCalled();
      expect(mockInngest.send).not.toHaveBeenCalled();
    });

    it('should handle inngest send failure gracefully', async () => {
      (mockInngest.send as MockedFunction<any>).mockRejectedValue(new Error('Inngest send failed'));

      const caller = messageRouter.createCaller(mockContext);
      await expect(caller.create(validInput)).rejects.toThrow('Inngest send failed');

      expect(mockPrisma.project.findUnique).toHaveBeenCalled();
      expect(mockPrisma.message.create).toHaveBeenCalled();
    });

    it('should create message with special characters in value', async () => {
      const specialCharsInput = {
        value: 'Test with special chars: !@#$%^&*()_+-=[]{}|;\':"<>?,./',
        projectId: 'test-project-id',
      };

      const caller = messageRouter.createCaller(mockContext);
      const result = await caller.create(specialCharsInput);

      expect(mockPrisma.message.create).toHaveBeenCalledWith({
        data: {
          projectId: 'test-project-id',
          content: specialCharsInput.value,
          role: 'USER',
          type: 'RESULT',
        },
      });

      expect(result).toEqual(mockCreatedMessage);
    });

    it('should create message with unicode characters in value', async () => {
      const unicodeInput = {
        value: 'Test with unicode: 你好 🚀 café naïve résumé',
        projectId: 'test-project-id',
      };

      const caller = messageRouter.createCaller(mockContext);
      const result = await caller.create(unicodeInput);

      expect(mockPrisma.message.create).toHaveBeenCalledWith({
        data: {
          projectId: 'test-project-id',
          content: unicodeInput.value,
          role: 'USER',
          type: 'RESULT',
        },
      });

      expect(result).toEqual(mockCreatedMessage);
    });

    it('should properly send inngest event with correct data structure', async () => {
      const caller = messageRouter.createCaller(mockContext);
      await caller.create(validInput);

      expect(mockInngest.send).toHaveBeenCalledWith({
        name: 'code-agent/run',
        data: {
          value: 'Test message content',
          projectId: 'test-project-id',
        },
      });
      expect(mockInngest.send).toHaveBeenCalledTimes(1);
    });

    it('should handle value with only whitespace', async () => {
      const whitespaceValueInput = {
        value: '   ',
        projectId: 'test-project-id',
      };

      // This should pass validation since whitespace is technically a valid string with length > 0
      const caller = messageRouter.createCaller(mockContext);
      const result = await caller.create(whitespaceValueInput);

      expect(mockPrisma.message.create).toHaveBeenCalledWith({
        data: {
          projectId: 'test-project-id',
          content: '   ',
          role: 'USER',
          type: 'RESULT',
        },
      });

      expect(result).toEqual(mockCreatedMessage);
    });

    it('should handle newlines and tabs in message content', async () => {
      const multilineInput = {
        value: 'Line 1\nLine 2\n\tIndented line\r\nWindows line ending',
        projectId: 'test-project-id',
      };

      const caller = messageRouter.createCaller(mockContext);
      const result = await caller.create(multilineInput);

      expect(mockPrisma.message.create).toHaveBeenCalledWith({
        data: {
          projectId: 'test-project-id',
          content: multilineInput.value,
          role: 'USER',
          type: 'RESULT',
        },
      });

      expect(result).toEqual(mockCreatedMessage);
    });

    it('should handle concurrent message creation attempts', async () => {
      const caller = messageRouter.createCaller(mockContext);
      
      const promises = Array.from({ length: 5 }, (_, i) => 
        caller.create({
          value: `Concurrent message ${i}`,
          projectId: 'test-project-id',
        })
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(5);
      expect(mockPrisma.project.findUnique).toHaveBeenCalledTimes(5);
      expect(mockPrisma.message.create).toHaveBeenCalledTimes(5);
      expect(mockInngest.send).toHaveBeenCalledTimes(5);
    });

    it('should handle message content with JSON-like strings', async () => {
      const jsonInput = {
        value: '{"type": "query", "content": "How to test?", "metadata": {"priority": "high"}}',
        projectId: 'test-project-id',
      };

      const caller = messageRouter.createCaller(mockContext);
      const result = await caller.create(jsonInput);

      expect(mockPrisma.message.create).toHaveBeenCalledWith({
        data: {
          projectId: 'test-project-id',
          content: jsonInput.value,
          role: 'USER',
          type: 'RESULT',
        },
      });

      expect(result).toEqual(mockCreatedMessage);
    });

    it('should handle message content with HTML-like strings', async () => {
      const htmlInput = {
        value: '<div class="message">Hello <strong>world</strong>!</div>',
        projectId: 'test-project-id',
      };

      const caller = messageRouter.createCaller(mockContext);
      const result = await caller.create(htmlInput);

      expect(mockPrisma.message.create).toHaveBeenCalledWith({
        data: {
          projectId: 'test-project-id',
          content: htmlInput.value,
          role: 'USER',
          type: 'RESULT',
        },
      });

      expect(result).toEqual(mockCreatedMessage);
    });
  });

  describe('input validation edge cases', () => {
    it('should handle null input gracefully', async () => {
      const caller = messageRouter.createCaller(mockContext);
      
      await expect(caller.getMany(null as any)).rejects.toThrow();
      await expect(caller.create(null as any)).rejects.toThrow();
    });

    it('should handle undefined input gracefully', async () => {
      const caller = messageRouter.createCaller(mockContext);

      await expect(caller.getMany(undefined as any)).rejects.toThrow();
      await expect(caller.create(undefined as any)).rejects.toThrow();
    });

    it('should handle projectId with only whitespace', async () => {
      const whitespaceInput = { projectId: '   ' };
      const caller = messageRouter.createCaller(mockContext);

      await expect(caller.getMany(whitespaceInput)).rejects.toThrow();

      const createWhitespaceInput = {
        value: 'Test message',
        projectId: '   ',
      };

      await expect(caller.create(createWhitespaceInput)).rejects.toThrow();
    });

    it('should handle extremely long projectId', async () => {
      const longProjectId = 'a'.repeat(1000);
      const inputWithLongProjectId = { projectId: longProjectId };
      
      (mockPrisma.message.findMany as MockedFunction<any>).mockResolvedValue([]);
      
      const caller = messageRouter.createCaller(mockContext);
      const result = await caller.getMany(inputWithLongProjectId);

      expect(result).toEqual([]);
      expect(mockPrisma.message.findMany).toHaveBeenCalledWith({
        where: {
          projectId: longProjectId,
          project: {
            userId: 'test-user-id',
          },
        },
        orderBy: {
          updatedAt: 'asc',
        },
        include: {
          fragment: true,
        },
      });
    });

    it('should handle projectId with special characters', async () => {
      const specialProjectId = 'project-!@#$%^&*()';
      const inputWithSpecialChars = { projectId: specialProjectId };
      
      (mockPrisma.message.findMany as MockedFunction<any>).mockResolvedValue([]);
      
      const caller = messageRouter.createCaller(mockContext);
      const result = await caller.getMany(inputWithSpecialChars);

      expect(result).toEqual([]);
      expect(mockPrisma.message.findMany).toHaveBeenCalledWith({
        where: {
          projectId: specialProjectId,
          project: {
            userId: 'test-user-id',
          },
        },
        orderBy: {
          updatedAt: 'asc',
        },
        include: {
          fragment: true,
        },
      });
    });

    it('should handle invalid data types for input fields', async () => {
      const caller = messageRouter.createCaller(mockContext);

      // Test numeric projectId
      await expect(caller.getMany({ projectId: 123 as any })).rejects.toThrow();

      // Test boolean value
      await expect(caller.create({
        value: true as any,
        projectId: 'test-project-id',
      })).rejects.toThrow();

      // Test array projectId
      await expect(caller.create({
        value: 'test',
        projectId: ['test'] as any,
      })).rejects.toThrow();
    });
  });

  describe('context handling', () => {
    it('should handle missing auth context gracefully', async () => {
      const invalidContext = {} as any;
      const caller = messageRouter.createCaller(invalidContext);

      await expect(caller.getMany({ projectId: 'test' })).rejects.toThrow();
      await expect(caller.create({
        value: 'test',
        projectId: 'test',
      })).rejects.toThrow();
    });

    it('should handle missing userId in auth context', async () => {
      const incompleteContext = { auth: {} } as any;
      const caller = messageRouter.createCaller(incompleteContext);

      await expect(caller.getMany({ projectId: 'test' })).rejects.toThrow();
      await expect(caller.create({
        value: 'test',
        projectId: 'test',
      })).rejects.toThrow();
    });

    it('should handle null userId in auth context', async () => {
      const nullUserContext = { auth: { userId: null } } as any;
      const caller = messageRouter.createCaller(nullUserContext);

      await expect(caller.getMany({ projectId: 'test' })).rejects.toThrow();
      await expect(caller.create({
        value: 'test',
        projectId: 'test',
      })).rejects.toThrow();
    });

    it('should handle undefined userId in auth context', async () => {
      const undefinedUserContext = { auth: { userId: undefined } } as any;
      const caller = messageRouter.createCaller(undefinedUserContext);

      await expect(caller.getMany({ projectId: 'test' })).rejects.toThrow();
      await expect(caller.create({
        value: 'test',
        projectId: 'test',
      })).rejects.toThrow();
    });

    it('should handle empty string userId', async () => {
      const emptyUserContext = { auth: { userId: '' } };
      
      (mockPrisma.message.findMany as MockedFunction<any>).mockResolvedValue([]);
      
      const caller = messageRouter.createCaller(emptyUserContext);
      const result = await caller.getMany({ projectId: 'test-project-id' });

      expect(result).toEqual([]);
      expect(mockPrisma.message.findMany).toHaveBeenCalledWith({
        where: {
          projectId: 'test-project-id',
          project: {
            userId: '',
          },
        },
        orderBy: {
          updatedAt: 'asc',
        },
        include: {
          fragment: true,
        },
      });
    });
  });

  describe('integration scenarios', () => {
    it('should maintain data consistency throughout the create flow', async () => {
      const testInput = {
        value: 'Integration test message',
        projectId: 'integration-project-id',
      };

      const testProject = {
        id: 'integration-project-id',
        userId: 'test-user-id',
        name: 'Integration Test Project',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      const testMessage = {
        id: 'integration-message-id',
        content: 'Integration test message',
        projectId: 'integration-project-id',
        role: 'USER' as const,
        type: 'RESULT' as const,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      (mockPrisma.project.findUnique as MockedFunction<any>).mockResolvedValue(testProject);
      (mockPrisma.message.create as MockedFunction<any>).mockResolvedValue(testMessage);
      (mockInngest.send as MockedFunction<any>).mockResolvedValue(undefined);

      const caller = messageRouter.createCaller(mockContext);
      const result = await caller.create(testInput);

      // Verify the entire flow executed correctly
      expect(result).toEqual(testMessage);
      expect(result.content).toBe(testInput.value);
      expect(result.projectId).toBe(testInput.projectId);
      
      // Verify call order - project lookup should happen before message creation
      expect(mockPrisma.project.findUnique).toHaveBeenCalled();
      expect(mockPrisma.message.create).toHaveBeenCalled();
      expect(mockInngest.send).toHaveBeenCalled();
    });

    it('should handle partial failures gracefully', async () => {
      const testInput = {
        value: 'Test message for partial failure',
        projectId: 'test-project-id',
      };

      const mockProject = {
        id: 'test-project-id',
        userId: 'test-user-id',
        name: 'Test Project',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      const mockCreatedMessage = {
        id: 'new-message-id',
        content: 'Test message for partial failure',
        projectId: 'test-project-id',
        role: 'USER',
        type: 'RESULT',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      // Project lookup succeeds
      (mockPrisma.project.findUnique as MockedFunction<any>).mockResolvedValue(mockProject);
      
      // Message creation succeeds
      (mockPrisma.message.create as MockedFunction<any>).mockResolvedValue(mockCreatedMessage);
      
      // But inngest fails
      (mockInngest.send as MockedFunction<any>).mockRejectedValue(new Error('External service unavailable'));

      const caller = messageRouter.createCaller(mockContext);
      await expect(caller.create(testInput)).rejects.toThrow('External service unavailable');

      // Verify that database operations completed before the failure
      expect(mockPrisma.project.findUnique).toHaveBeenCalled();
      expect(mockPrisma.message.create).toHaveBeenCalled();
    });

    it('should handle rapid successive calls', async () => {
      const inputs = Array.from({ length: 10 }, (_, i) => ({
        value: `Rapid message ${i}`,
        projectId: 'test-project-id',
      }));

      const mockProject = {
        id: 'test-project-id',
        userId: 'test-user-id',
        name: 'Test Project',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      const mockCreatedMessage = {
        id: 'new-message-id',
        content: 'Test message content',
        projectId: 'test-project-id',
        role: 'USER',
        type: 'RESULT',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      (mockPrisma.project.findUnique as MockedFunction<any>).mockResolvedValue(mockProject);
      (mockPrisma.message.create as MockedFunction<any>).mockResolvedValue(mockCreatedMessage);
      (mockInngest.send as MockedFunction<any>).mockResolvedValue(undefined);

      const caller = messageRouter.createCaller(mockContext);
      const promises = inputs.map(input => caller.create(input));
      
      const results = await Promise.all(promises);

      expect(results).toHaveLength(10);
      expect(mockPrisma.project.findUnique).toHaveBeenCalledTimes(10);
      expect(mockPrisma.message.create).toHaveBeenCalledTimes(10);
      expect(mockInngest.send).toHaveBeenCalledTimes(10);
    });
  });

  describe('performance and stress scenarios', () => {
    it('should handle messages at boundary length efficiently', async () => {
      const boundaryValues = [
        'a', // minimum length (1 char)
        'a'.repeat(100), // small message
        'a'.repeat(5000), // medium message
        'a'.repeat(9999), // near max
        'a'.repeat(10000), // exactly max
      ];

      const mockProject = {
        id: 'test-project-id',
        userId: 'test-user-id',
        name: 'Test Project',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      const mockCreatedMessage = {
        id: 'new-message-id',
        content: 'Test message content',
        projectId: 'test-project-id',
        role: 'USER',
        type: 'RESULT',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      (mockPrisma.project.findUnique as MockedFunction<any>).mockResolvedValue(mockProject);
      (mockPrisma.message.create as MockedFunction<any>).mockResolvedValue(mockCreatedMessage);
      (mockInngest.send as MockedFunction<any>).mockResolvedValue(undefined);

      const caller = messageRouter.createCaller(mockContext);
      
      for (const value of boundaryValues) {
        const result = await caller.create({
          value,
          projectId: 'test-project-id',
        });
        
        expect(result).toEqual(mockCreatedMessage);
      }

      expect(mockPrisma.message.create).toHaveBeenCalledTimes(boundaryValues.length);
    });

    it('should handle mixed valid and invalid inputs gracefully', async () => {
      const mixedInputs = [
        { value: 'Valid message', projectId: 'test-project-id' }, // valid
        { value: '', projectId: 'test-project-id' }, // invalid - empty value
        { value: 'Another valid message', projectId: 'test-project-id' }, // valid
        { value: 'Valid message', projectId: '' }, // invalid - empty projectId
      ];

      const mockProject = {
        id: 'test-project-id',
        userId: 'test-user-id',
        name: 'Test Project',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      const mockCreatedMessage = {
        id: 'new-message-id',
        content: 'Test message content',
        projectId: 'test-project-id',
        role: 'USER',
        type: 'RESULT',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      (mockPrisma.project.findUnique as MockedFunction<any>).mockResolvedValue(mockProject);
      (mockPrisma.message.create as MockedFunction<any>).mockResolvedValue(mockCreatedMessage);
      (mockInngest.send as MockedFunction<any>).mockResolvedValue(undefined);

      const caller = messageRouter.createCaller(mockContext);
      
      // Test valid inputs succeed
      await expect(caller.create(mixedInputs[0])).resolves.toEqual(mockCreatedMessage);
      await expect(caller.create(mixedInputs[2])).resolves.toEqual(mockCreatedMessage);
      
      // Test invalid inputs fail
      await expect(caller.create(mixedInputs[1])).rejects.toThrow();
      await expect(caller.create(mixedInputs[3])).rejects.toThrow();

      // Only valid inputs should have triggered database operations
      expect(mockPrisma.project.findUnique).toHaveBeenCalledTimes(2);
      expect(mockPrisma.message.create).toHaveBeenCalledTimes(2);
    });
  });
});