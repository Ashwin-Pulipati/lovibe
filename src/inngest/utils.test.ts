import { Sandbox } from "@e2b/code-interpreter";
import { AgentResult, type Message, TextMessage } from "@inngest/agent-kit";
import { getSandbox, lastAssistantTextMessageContent, parseAgentOutput } from "./utils";

// Mock the external dependencies
jest.mock("@e2b/code-interpreter");

const MockedSandbox = Sandbox as jest.MockedClass<typeof Sandbox>;

describe("Utils", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getSandbox", () => {
    it("should successfully connect to a sandbox with valid ID", async () => {
      const mockSandbox = { id: "test-sandbox-123" };
      MockedSandbox.connect = jest.fn().mockResolvedValue(mockSandbox);

      const result = await getSandbox("test-sandbox-123");

      expect(MockedSandbox.connect).toHaveBeenCalledWith("test-sandbox-123");
      expect(result).toBe(mockSandbox);
    });

    it("should handle connection failure gracefully", async () => {
      const error = new Error("Connection failed");
      MockedSandbox.connect = jest.fn().mockRejectedValue(error);

      await expect(getSandbox("invalid-id")).rejects.toThrow("Connection failed");
      expect(MockedSandbox.connect).toHaveBeenCalledWith("invalid-id");
    });

    it("should handle empty sandbox ID", async () => {
      MockedSandbox.connect = jest.fn().mockResolvedValue({ id: "" });

      const result = await getSandbox("");

      expect(MockedSandbox.connect).toHaveBeenCalledWith("");
      expect(result).toEqual({ id: "" });
    });

    it("should handle null or undefined sandbox ID", async () => {
      MockedSandbox.connect = jest.fn().mockResolvedValue(null);

      const result = await getSandbox(null as any);

      expect(MockedSandbox.connect).toHaveBeenCalledWith(null);
      expect(result).toBe(null);
    });
  });

  describe("lastAssistantTextMessageContent", () => {
    it("should return content from the last assistant text message with string content", () => {
      const result: AgentResult = {
        output: [
          { role: "user", content: "Hello", type: "text" } as TextMessage,
          { role: "assistant", content: "Hi there!", type: "text" } as TextMessage,
          { role: "user", content: "How are you?", type: "text" } as TextMessage,
          { role: "assistant", content: "I'm doing well!", type: "text" } as TextMessage,
        ],
      };

      const content = lastAssistantTextMessageContent(result);

      expect(content).toBe("I'm doing well!");
    });

    it("should return joined content from the last assistant text message with array content", () => {
      const result: AgentResult = {
        output: [
          { role: "user", content: "Hello", type: "text" } as TextMessage,
          { 
            role: "assistant", 
            content: [
              { text: "Hello ", type: "text" },
              { text: "world!", type: "text" }
            ], 
            type: "text" 
          } as TextMessage,
        ],
      };

      const content = lastAssistantTextMessageContent(result);

      expect(content).toBe("Hello world!");
    });

    it("should return undefined when no assistant messages exist", () => {
      const result: AgentResult = {
        output: [
          { role: "user", content: "Hello", type: "text" } as TextMessage,
          { role: "user", content: "Anyone there?", type: "text" } as TextMessage,
        ],
      };

      const content = lastAssistantTextMessageContent(result);

      expect(content).toBeUndefined();
    });

    it("should return undefined when output is empty", () => {
      const result: AgentResult = {
        output: [],
      };

      const content = lastAssistantTextMessageContent(result);

      expect(content).toBeUndefined();
    });

    it("should return undefined when last assistant message has no content", () => {
      const result: AgentResult = {
        output: [
          { role: "assistant", content: "", type: "text" } as TextMessage,
        ],
      };

      const content = lastAssistantTextMessageContent(result);

      expect(content).toBeUndefined();
    });

    it("should handle assistant message with null content", () => {
      const result: AgentResult = {
        output: [
          { role: "assistant", content: null, type: "text" } as any,
        ],
      };

      const content = lastAssistantTextMessageContent(result);

      expect(content).toBeUndefined();
    });

    it("should handle assistant message with undefined content", () => {
      const result: AgentResult = {
        output: [
          { role: "assistant", content: undefined, type: "text" } as any,
        ],
      };

      const content = lastAssistantTextMessageContent(result);

      expect(content).toBeUndefined();
    });

    it("should handle empty array content", () => {
      const result: AgentResult = {
        output: [
          { 
            role: "assistant", 
            content: [], 
            type: "text" 
          } as TextMessage,
        ],
      };

      const content = lastAssistantTextMessageContent(result);

      expect(content).toBe("");
    });

    it("should handle array content with empty text chunks", () => {
      const result: AgentResult = {
        output: [
          { 
            role: "assistant", 
            content: [
              { text: "", type: "text" },
              { text: "", type: "text" }
            ], 
            type: "text" 
          } as TextMessage,
        ],
      };

      const content = lastAssistantTextMessageContent(result);

      expect(content).toBe("");
    });

    it("should find last assistant message when mixed with other roles", () => {
      const result: AgentResult = {
        output: [
          { role: "system", content: "System message", type: "text" } as TextMessage,
          { role: "assistant", content: "First assistant", type: "text" } as TextMessage,
          { role: "user", content: "User message", type: "text" } as TextMessage,
          { role: "assistant", content: "Last assistant", type: "text" } as TextMessage,
          { role: "user", content: "Final user", type: "text" } as TextMessage,
        ],
      };

      const content = lastAssistantTextMessageContent(result);

      expect(content).toBe("Last assistant");
    });
  });

  describe("parseAgentOutput", () => {
    it("should return string content from text message", () => {
      const messages: Message[] = [
        { type: "text", content: "Hello world!" } as Message,
      ];

      const result = parseAgentOutput(messages);

      expect(result).toBe("Hello world!");
    });

    it("should return joined content from array content", () => {
      const messages: Message[] = [
        { 
          type: "text", 
          content: [
            { text: "Hello " },
            { text: "world!" }
          ] 
        } as Message,
      ];

      const result = parseAgentOutput(messages);

      expect(result).toBe("Hello world!");
    });

    it("should return 'Fragment' for non-text message types", () => {
      const messages: Message[] = [
        { type: "image", content: "base64-image-data" } as Message,
      ];

      const result = parseAgentOutput(messages);

      expect(result).toBe("Fragment");
    });

    it("should return 'Fragment' for unknown message types", () => {
      const messages: Message[] = [
        { type: "custom", content: "custom content" } as any,
      ];

      const result = parseAgentOutput(messages);

      expect(result).toBe("Fragment");
    });

    it("should handle empty string content", () => {
      const messages: Message[] = [
        { type: "text", content: "" } as Message,
      ];

      const result = parseAgentOutput(messages);

      expect(result).toBe("");
    });

    it("should handle empty array content", () => {
      const messages: Message[] = [
        { type: "text", content: [] } as Message,
      ];

      const result = parseAgentOutput(messages);

      expect(result).toBe("");
    });

    it("should handle null content", () => {
      const messages: Message[] = [
        { type: "text", content: null } as any,
      ];

      const result = parseAgentOutput(messages);

      expect(result).toBe(null);
    });

    it("should handle undefined content", () => {
      const messages: Message[] = [
        { type: "text", content: undefined } as any,
      ];

      const result = parseAgentOutput(messages);

      expect(result).toBe(undefined);
    });

    it("should handle array with mixed content types", () => {
      const messages: Message[] = [
        { 
          type: "text", 
          content: [
            "plain string",
            { text: "object text" },
            123,
            null,
            undefined
          ] 
        } as any,
      ];

      const result = parseAgentOutput(messages);

      expect(result).toBe("plain stringobject text123nullundefined");
    });

    it("should handle empty messages array", () => {
      const messages: Message[] = [];

      expect(() => parseAgentOutput(messages)).toThrow();
    });

    it("should only process first message in array", () => {
      const messages: Message[] = [
        { type: "text", content: "First message" } as Message,
        { type: "text", content: "Second message" } as Message,
      ];

      const result = parseAgentOutput(messages);

      expect(result).toBe("First message");
    });

    it("should handle message with missing type property", () => {
      const messages: Message[] = [
        { content: "Content without type" } as any,
      ];

      const result = parseAgentOutput(messages);

      expect(result).toBe("Fragment");
    });

    it("should handle message with missing content property", () => {
      const messages: Message[] = [
        { type: "text" } as any,
      ];

      const result = parseAgentOutput(messages);

      expect(result).toBe(undefined);
    });
  });
});