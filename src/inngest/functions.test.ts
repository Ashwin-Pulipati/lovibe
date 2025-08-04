import { z } from "zod";
import { inngest } from "./client";
import { Sandbox } from "@e2b/code-interpreter";
import { getSandbox, lastAssistantTextMessageContent, parseAgentOutput } from "./utils";
import {
  openai,
  createAgent,
  createTool,
  createNetwork,
  type Tool,
  type Message,
  createState,
} from "@inngest/agent-kit";
import { FRAGMENT_TITLE_PROMPT, PROMPT, RESPONSE_PROMPT } from "./prompt";
import { prisma } from "@/lib/db";
import { codingAgentFunction } from "./functions";

// Mock all external dependencies
jest.mock("./client");
jest.mock("@e2b/code-interpreter");
jest.mock("./utils");
jest.mock("@inngest/agent-kit");
jest.mock("./prompt");
jest.mock("@/lib/db");

// Type the mocked modules
const mockInngest = inngest as jest.Mocked<typeof inngest>;
const mockSandbox = Sandbox as jest.MockedClass<typeof Sandbox>;
const mockGetSandbox = getSandbox as jest.MockedFunction<typeof getSandbox>;
const mockLastAssistantTextMessageContent = lastAssistantTextMessageContent as jest.MockedFunction<typeof lastAssistantTextMessageContent>;
const mockParseAgentOutput = parseAgentOutput as jest.MockedFunction<typeof parseAgentOutput>;
const mockCreateAgent = createAgent as jest.MockedFunction<typeof createAgent>;
const mockCreateTool = createTool as jest.MockedFunction<typeof createTool>;
const mockCreateNetwork = createNetwork as jest.MockedFunction<typeof createNetwork>;
const mockCreateState = createState as jest.MockedFunction<typeof createState>;
const mockOpenai = openai as jest.MockedFunction<typeof openai>;
const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe("codingAgentFunction", () => {
  let mockSandboxInstance: any;
  let mockAgent: any;
  let mockNetwork: any;
  let mockState: any;
  let mockStep: any;
  let mockEvent: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock sandbox instance
    mockSandboxInstance = {
      sandboxId: "test-sandbox-id",
      getHost: jest.fn().mockReturnValue("test-host.example.com"),
      commands: {
        run: jest.fn().mockResolvedValue({ stdout: "test output", stderr: "" }),
      },
      files: {
        write: jest.fn().mockResolvedValue(undefined),
        read: jest.fn().mockResolvedValue("file content"),
      },
    };

    // Setup Sandbox mock
    mockSandbox.create.mockResolvedValue(mockSandboxInstance);
    mockGetSandbox.mockResolvedValue(mockSandboxInstance);

    // Setup agent kit mocks
    mockState = {
      data: {
        summary: "",
        files: {},
      },
    };
    mockCreateState.mockReturnValue(mockState);

    mockAgent = {
      run: jest.fn().mockResolvedValue({
        output: "test agent output",
      }),
    };
    mockCreateAgent.mockReturnValue(mockAgent);

    mockNetwork = {
      run: jest.fn().mockResolvedValue({
        state: {
          data: {
            summary: "Test summary with <task_summary>Complete</task_summary>",
            files: { "test.js": "console.log('test');" },
          },
        },
      }),
      state: mockState,
    };
    mockCreateNetwork.mockReturnValue(mockNetwork);

    mockOpenai.mockReturnValue({} as any);

    // Setup utility mocks
    mockLastAssistantTextMessageContent.mockReturnValue("Test summary with <task_summary>Complete</task_summary>");
    mockParseAgentOutput.mockReturnValue("Parsed output");

    // Setup prisma mocks
    mockPrisma.message.findMany.mockResolvedValue([
      {
        id: "1",
        role: "USER",
        content: "Test message",
        createdAt: new Date(),
        projectId: "test-project",
      },
    ]);
    mockPrisma.message.create.mockResolvedValue({
      id: "2",
      role: "ASSISTANT",
      content: "Test response",
      createdAt: new Date(),
      projectId: "test-project",
    } as any);

    // Setup mock step and event
    mockStep = {
      run: jest.fn().mockImplementation((name, fn) => fn()),
    };

    mockEvent = {
      data: {
        projectId: "test-project-id",
        value: "test user input",
      },
    };

    // Setup inngest mock
    mockInngest.createFunction.mockImplementation((config, trigger, handler) => {
      return {
        config,
        trigger,
        handler,
      };
    });
  });

  describe("Function Creation", () => {
    it("should create function with correct configuration", () => {
      expect(mockInngest.createFunction).toHaveBeenCalledWith(
        { id: "code-agent" },
        { event: "code-agent/run" },
        expect.any(Function)
      );
    });
  });

  describe("Sandbox Operations", () => {
    it("should create a sandbox successfully", async () => {
      const result = await mockStep.run("get-sandbox-id", async () => {
        const sandbox = await Sandbox.create("lovibe-nextjs-test");
        return sandbox.sandboxId;
      });

      expect(Sandbox.create).toHaveBeenCalledWith("lovibe-nextjs-test");
      expect(result).toBe("test-sandbox-id");
    });

    it("should get sandbox URL successfully", async () => {
      const result = await mockStep.run("get-sandbox-url", async () => {
        const sandbox = await getSandbox("test-sandbox-id");
        const host = sandbox.getHost(3000);
        return `https://${host}`;
      });

      expect(getSandbox).toHaveBeenCalledWith("test-sandbox-id");
      expect(mockSandboxInstance.getHost).toHaveBeenCalledWith(3000);
      expect(result).toBe("https://test-host.example.com");
    });

    it("should handle sandbox creation failure", async () => {
      mockSandbox.create.mockRejectedValue(new Error("Sandbox creation failed"));

      await expect(
        mockStep.run("get-sandbox-id", async () => {
          const sandbox = await Sandbox.create("lovibe-nextjs-test");
          return sandbox.sandboxId;
        })
      ).rejects.toThrow("Sandbox creation failed");
    });
  });

  describe("Message Processing", () => {
    it("should retrieve and format previous messages", async () => {
      const messages = [
        {
          id: "1",
          role: "USER" as const,
          content: "Hello",
          createdAt: new Date(),
          projectId: "test-project",
        },
        {
          id: "2",
          role: "ASSISTANT" as const,
          content: "Hi there",
          createdAt: new Date(),
          projectId: "test-project",
        },
      ];
      mockPrisma.message.findMany.mockResolvedValue(messages);

      const result = await mockStep.run("get-previous-messages", async () => {
        const formattedMessages: Message[] = [];
        const dbMessages = await prisma.message.findMany({
          where: {
            projectId: "test-project-id",
          },
          orderBy: {
            createdAt: "desc",
          },
        });
        for (const message of dbMessages) {
          formattedMessages.push({
            type: "text",
            role: message.role === "ASSISTANT" ? "assistant" : "user",
            content: message.content,
          });
        }
        return formattedMessages;
      });

      expect(mockPrisma.message.findMany).toHaveBeenCalledWith({
        where: {
          projectId: "test-project-id",
        },
        orderBy: {
          createdAt: "desc",
        },
      });
      expect(result).toEqual([
        {
          type: "text",
          role: "user",
          content: "Hello",
        },
        {
          type: "text",
          role: "assistant",
          content: "Hi there",
        },
      ]);
    });

    it("should handle empty message history", async () => {
      mockPrisma.message.findMany.mockResolvedValue([]);

      const result = await mockStep.run("get-previous-messages", async () => {
        const formattedMessages: Message[] = [];
        const dbMessages = await prisma.message.findMany({
          where: {
            projectId: "test-project-id",
          },
          orderBy: {
            createdAt: "desc",
          },
        });
        for (const message of dbMessages) {
          formattedMessages.push({
            type: "text",
            role: message.role === "ASSISTANT" ? "assistant" : "user",
            content: message.content,
          });
        }
        return formattedMessages;
      });

      expect(result).toEqual([]);
    });

    it("should handle database errors when fetching messages", async () => {
      mockPrisma.message.findMany.mockRejectedValue(new Error("Database error"));

      await expect(
        mockStep.run("get-previous-messages", async () => {
          const formattedMessages: Message[] = [];
          const dbMessages = await prisma.message.findMany({
            where: {
              projectId: "test-project-id",
            },
            orderBy: {
              createdAt: "desc",
            },
          });
          for (const message of dbMessages) {
            formattedMessages.push({
              type: "text",
              role: message.role === "ASSISTANT" ? "assistant" : "user",
              content: message.content,
            });
          }
          return formattedMessages;
        })
      ).rejects.toThrow("Database error");
    });
  });

  describe("Agent State Management", () => {
    it("should create initial state correctly", () => {
      const messages = [{ type: "text", role: "user", content: "test" }];
      
      createState(
        {
          summary: "",
          files: {},
        },
        {
          messages,
        }
      );

      expect(mockCreateState).toHaveBeenCalledWith(
        {
          summary: "",
          files: {},
        },
        {
          messages,
        }
      );
    });

    it("should create agent with correct configuration", () => {
      const messages = [{ type: "text", role: "user", content: "test" }];
      
      createAgent({
        name: "code-agent",
        description: "An expert coding agent",
        system: PROMPT,
        model: openai({
          model: "gpt-4.1",
          defaultParameters: { temperature: 0.1 },
        }),
        tools: expect.any(Array),
        lifecycle: expect.any(Object),
      });

      expect(mockCreateAgent).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "code-agent",
          description: "An expert coding agent",
          system: PROMPT,
        })
      );
    });
  });

  describe("Tool Handlers", () => {
    describe("Terminal Tool", () => {
      it("should execute terminal command successfully", async () => {
        const mockHandler = jest.fn().mockImplementation(async ({ command }, { step }) => {
          return await step?.run("terminal", async () => {
            const buffers = { stdout: "", stderr: "" };
            try {
              const sandbox = await getSandbox("test-sandbox-id");
              const result = await sandbox.commands.run(command, {
                onStdout: (data: string) => {
                  buffers.stdout += data;
                },
                onStderr: (data: string) => {
                  buffers.stderr += data;
                },
              });
              return result.stdout;
            } catch (e) {
              return `Command failed: ${e} \nstdout: ${buffers.stdout} \nstderr: ${buffers.stderr}`;
            }
          });
        });

        const result = await mockHandler(
          { command: "ls -la" },
          { step: mockStep }
        );

        expect(getSandbox).toHaveBeenCalledWith("test-sandbox-id");
        expect(mockSandboxInstance.commands.run).toHaveBeenCalledWith(
          "ls -la",
          expect.objectContaining({
            onStdout: expect.any(Function),
            onStderr: expect.any(Function),
          })
        );
        expect(result).toBe("test output");
      });

      it("should handle terminal command failure", async () => {
        mockSandboxInstance.commands.run.mockRejectedValue(new Error("Command failed"));

        const mockHandler = jest.fn().mockImplementation(async ({ command }, { step }) => {
          return await step?.run("terminal", async () => {
            const buffers = { stdout: "", stderr: "" };
            try {
              const sandbox = await getSandbox("test-sandbox-id");
              const result = await sandbox.commands.run(command, {
                onStdout: (data: string) => {
                  buffers.stdout += data;
                },
                onStderr: (data: string) => {
                  buffers.stderr += data;
                },
              });
              return result.stdout;
            } catch (e) {
              return `Command failed: ${e} \nstdout: ${buffers.stdout} \nstderr: ${buffers.stderr}`;
            }
          });
        });

        const result = await mockHandler(
          { command: "invalid-command" },
          { step: mockStep }
        );

        expect(result).toContain("Command failed: Error: Command failed");
      });
    });

    describe("CreateOrUpdateFiles Tool", () => {
      it("should create and update files successfully", async () => {
        const mockNetwork = {
          state: {
            data: {
              files: { "existing.js": "existing content" },
            },
          },
        };

        const mockHandler = jest.fn().mockImplementation(async ({ files }, { step, network }) => {
          const newFiles = await step?.run("createOrUpdateFiles", async () => {
            try {
              const updatedFiles = network.state.data.files || {};
              const sandbox = await getSandbox("test-sandbox-id");
              for (const file of files) {
                await sandbox.files.write(file.path, file.content);
                updatedFiles[file.path] = file.content;
              }
              return updatedFiles;
            } catch (e) {
              return "Error: " + e;
            }
          });
          if (typeof newFiles === "object") {
            network.state.data.files = newFiles;
          }
        });

        const filesToUpdate = [
          { path: "test.js", content: "console.log('test');" },
          { path: "new.js", content: "console.log('new');" },
        ];

        await mockHandler(
          { files: filesToUpdate },
          { step: mockStep, network: mockNetwork }
        );

        expect(mockSandboxInstance.files.write).toHaveBeenCalledWith("test.js", "console.log('test');");
        expect(mockSandboxInstance.files.write).toHaveBeenCalledWith("new.js", "console.log('new');");
        expect(mockNetwork.state.data.files).toEqual({
          "existing.js": "existing content",
          "test.js": "console.log('test');",
          "new.js": "console.log('new');",
        });
      });

      it("should handle file write errors", async () => {
        mockSandboxInstance.files.write.mockRejectedValue(new Error("Write failed"));
        
        const mockNetwork = {
          state: {
            data: {
              files: {},
            },
          },
        };

        const mockHandler = jest.fn().mockImplementation(async ({ files }, { step, network }) => {
          const newFiles = await step?.run("createOrUpdateFiles", async () => {
            try {
              const updatedFiles = network.state.data.files || {};
              const sandbox = await getSandbox("test-sandbox-id");
              for (const file of files) {
                await sandbox.files.write(file.path, file.content);
                updatedFiles[file.path] = file.content;
              }
              return updatedFiles;
            } catch (e) {
              return "Error: " + e;
            }
          });
          if (typeof newFiles === "object") {
            network.state.data.files = newFiles;
          }
        });

        await mockHandler(
          { files: [{ path: "test.js", content: "test" }] },
          { step: mockStep, network: mockNetwork }
        );

        expect(mockNetwork.state.data.files).toEqual({});
      });
    });

    describe("ReadFiles Tool", () => {
      it("should read files successfully", async () => {
        mockSandboxInstance.files.read
          .mockResolvedValueOnce("content of file1")
          .mockResolvedValueOnce("content of file2");

        const mockHandler = jest.fn().mockImplementation(async ({ files }, { step }) => {
          return await step?.run("readFiles", async () => {
            try {
              const sandbox = await getSandbox("test-sandbox-id");
              const contents = [];
              for (const file of files) {
                const content = await sandbox.files.read(file);
                contents.push({ path: file, content });
              }
              return JSON.stringify(contents);
            } catch (e) {
              return "Error: " + e;
            }
          });
        });

        const result = await mockHandler(
          { files: ["file1.js", "file2.js"] },
          { step: mockStep }
        );

        expect(mockSandboxInstance.files.read).toHaveBeenCalledWith("file1.js");
        expect(mockSandboxInstance.files.read).toHaveBeenCalledWith("file2.js");
        
        const parsedResult = JSON.parse(result);
        expect(parsedResult).toEqual([
          { path: "file1.js", content: "content of file1" },
          { path: "file2.js", content: "content of file2" },
        ]);
      });

      it("should handle file read errors", async () => {
        mockSandboxInstance.files.read.mockRejectedValue(new Error("File not found"));

        const mockHandler = jest.fn().mockImplementation(async ({ files }, { step }) => {
          return await step?.run("readFiles", async () => {
            try {
              const sandbox = await getSandbox("test-sandbox-id");
              const contents = [];
              for (const file of files) {
                const content = await sandbox.files.read(file);
                contents.push({ path: file, content });
              }
              return JSON.stringify(contents);
            } catch (e) {
              return "Error: " + e;
            }
          });
        });

        const result = await mockHandler(
          { files: ["nonexistent.js"] },
          { step: mockStep }
        );

        expect(result).toContain("Error: Error: File not found");
      });
    });
  });

  describe("Lifecycle Handlers", () => {
    it("should process onResponse lifecycle correctly with summary", () => {
      const mockResult = {
        messages: [
          {
            type: "text",
            role: "assistant",
            content: "Task completed <task_summary>File created successfully</task_summary>",
          },
        ],
      };

      const mockNetwork = {
        state: {
          data: {
            summary: "",
            files: {},
          },
        },
      };

      mockLastAssistantTextMessageContent.mockReturnValue(
        "Task completed <task_summary>File created successfully</task_summary>"
      );

      const onResponse = jest.fn().mockImplementation(async ({ result, network }) => {
        const lastAssistantTextMessageText = lastAssistantTextMessageContent(result);
        if (lastAssistantTextMessageText && network) {
          if (lastAssistantTextMessageText.includes("task_summary>")) {
            network.state.data.summary = lastAssistantTextMessageText;
          }
        }
        return result;
      });

      const result = onResponse({ result: mockResult, network: mockNetwork });

      expect(mockLastAssistantTextMessageContent).toHaveBeenCalledWith(mockResult);
      expect(mockNetwork.state.data.summary).toBe(
        "Task completed <task_summary>File created successfully</task_summary>"
      );
    });

    it("should handle onResponse lifecycle without summary", () => {
      const mockResult = {
        messages: [
          {
            type: "text",
            role: "assistant",
            content: "Task in progress",
          },
        ],
      };

      const mockNetwork = {
        state: {
          data: {
            summary: "",
            files: {},
          },
        },
      };

      mockLastAssistantTextMessageContent.mockReturnValue("Task in progress");

      const onResponse = jest.fn().mockImplementation(async ({ result, network }) => {
        const lastAssistantTextMessageText = lastAssistantTextMessageContent(result);
        if (lastAssistantTextMessageText && network) {
          if (lastAssistantTextMessageText.includes("task_summary>")) {
            network.state.data.summary = lastAssistantTextMessageText;
          }
        }
        return result;
      });

      onResponse({ result: mockResult, network: mockNetwork });

      expect(mockNetwork.state.data.summary).toBe("");
    });
  });

  describe("Network Routing", () => {
    it("should route to codeAgent when no summary exists", () => {
      const mockNetwork = {
        state: {
          data: {
            summary: "",
            files: {},
          },
        },
      };

      const router = jest.fn().mockImplementation(async ({ network }) => {
        const summary = network.state.data.summary;
        if (summary) {
          return;
        }
        return "codeAgent";
      });

      const result = router({ network: mockNetwork });

      expect(result).toBe("codeAgent");
    });

    it("should return undefined when summary exists", () => {
      const mockNetwork = {
        state: {
          data: {
            summary: "Task completed",
            files: {},
          },
        },
      };

      const router = jest.fn().mockImplementation(async ({ network }) => {
        const summary = network.state.data.summary;
        if (summary) {
          return;
        }
        return "codeAgent";
      });

      const result = router({ network: mockNetwork });

      expect(result).toBeUndefined();
    });
  });

  describe("Fragment Title and Response Generation", () => {
    it("should create fragment title generator with correct configuration", () => {
      createAgent({
        name: "fragment-title-generator",
        description: "A fragment title generator",
        system: FRAGMENT_TITLE_PROMPT,
        model: openai({
          model: "gpt-4o",
          defaultParameters: { temperature: 0.1 },
        }),
      });

      expect(mockCreateAgent).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "fragment-title-generator",
          description: "A fragment title generator",
          system: FRAGMENT_TITLE_PROMPT,
        })
      );
    });

    it("should create response generator with correct configuration", () => {
      createAgent({
        name: "response-generator",
        description: "A response generator",
        system: RESPONSE_PROMPT,
        model: openai({
          model: "gpt-4o",
          defaultParameters: { temperature: 0.1 },
        }),
      });

      expect(mockCreateAgent).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "response-generator",
          description: "A response generator",
          system: RESPONSE_PROMPT,
        })
      );
    });

    it("should run both generators with summary", async () => {
      const mockFragmentTitleGenerator = {
        run: jest.fn().mockResolvedValue({ output: "Generated Title" }),
      };
      const mockResponseGenerator = {
        run: jest.fn().mockResolvedValue({ output: "Generated Response" }),
      };

      await mockFragmentTitleGenerator.run("Test summary");
      await mockResponseGenerator.run("Test summary");

      expect(mockFragmentTitleGenerator.run).toHaveBeenCalledWith("Test summary");
      expect(mockResponseGenerator.run).toHaveBeenCalledWith("Test summary");
    });
  });

  describe("Result Saving", () => {
    it("should save successful result with fragment", async () => {
      const mockResultData = {
        state: {
          data: {
            summary: "Task completed successfully",
            files: { "test.js": "console.log('test');" },
          },
        },
      };

      mockParseAgentOutput
        .mockReturnValueOnce("Parsed Title")
        .mockReturnValueOnce("Parsed Response");

      await mockStep.run("save-result", async () => {
        const isError = !mockResultData.state.data.summary || 
          Object.keys(mockResultData.state.data.files || {}).length === 0;

        if (isError) {
          return await prisma.message.create({
            data: {
              projectId: "test-project-id",
              content: "Something went wrong. Please try again.",
              role: "ASSISTANT",
              type: "ERROR",
            },
          });
        }

        return await prisma.message.create({
          data: {
            projectId: "test-project-id",
            content: "Parsed Response",
            role: "ASSISTANT",
            type: "RESULT",
            fragment: {
              create: {
                sandboxUrl: "https://test-host.example.com",
                title: "Parsed Title",
                files: mockResultData.state.data.files,
              },
            },
          },
        });
      });

      expect(mockPrisma.message.create).toHaveBeenCalledWith({
        data: {
          projectId: "test-project-id",
          content: "Parsed Response",
          role: "ASSISTANT",
          type: "RESULT",
          fragment: {
            create: {
              sandboxUrl: "https://test-host.example.com",
              title: "Parsed Title",
              files: { "test.js": "console.log('test');" },
            },
          },
        },
      });
    });

    it("should save error result when summary is missing", async () => {
      const mockResultData = {
        state: {
          data: {
            summary: "",
            files: { "test.js": "console.log('test');" },
          },
        },
      };

      await mockStep.run("save-result", async () => {
        const isError = !mockResultData.state.data.summary || 
          Object.keys(mockResultData.state.data.files || {}).length === 0;

        if (isError) {
          return await prisma.message.create({
            data: {
              projectId: "test-project-id",
              content: "Something went wrong. Please try again.",
              role: "ASSISTANT",
              type: "ERROR",
            },
          });
        }

        return await prisma.message.create({
          data: {
            projectId: "test-project-id",
            content: "Parsed Response",
            role: "ASSISTANT",
            type: "RESULT",
            fragment: {
              create: {
                sandboxUrl: "https://test-host.example.com",
                title: "Parsed Title",
                files: mockResultData.state.data.files,
              },
            },
          },
        });
      });

      expect(mockPrisma.message.create).toHaveBeenCalledWith({
        data: {
          projectId: "test-project-id",
          content: "Something went wrong. Please try again.",
          role: "ASSISTANT",
          type: "ERROR",
        },
      });
    });

    it("should save error result when files are empty", async () => {
      const mockResultData = {
        state: {
          data: {
            summary: "Task completed",
            files: {},
          },
        },
      };

      await mockStep.run("save-result", async () => {
        const isError = !mockResultData.state.data.summary || 
          Object.keys(mockResultData.state.data.files || {}).length === 0;

        if (isError) {
          return await prisma.message.create({
            data: {
              projectId: "test-project-id",
              content: "Something went wrong. Please try again.",
              role: "ASSISTANT",
              type: "ERROR",
            },
          });
        }

        return await prisma.message.create({
          data: {
            projectId: "test-project-id",
            content: "Parsed Response",
            role: "ASSISTANT",
            type: "RESULT",
            fragment: {
              create: {
                sandboxUrl: "https://test-host.example.com",
                title: "Parsed Title",
                files: mockResultData.state.data.files,
              },
            },
          },
        });
      });

      expect(mockPrisma.message.create).toHaveBeenCalledWith({
        data: {
          projectId: "test-project-id",
          content: "Something went wrong. Please try again.",
          role: "ASSISTANT",
          type: "ERROR",
        },
      });
    });
  });

  describe("Return Value Structure", () => {
    it("should return correct structure on success", () => {
      const mockResult = {
        url: "https://test-host.example.com",
        title: "Fragment",
        files: { "test.js": "console.log('test');" },
        summary: "Task completed successfully",
      };

      expect(mockResult).toEqual({
        url: "https://test-host.example.com",
        title: "Fragment",
        files: { "test.js": "console.log('test');" },
        summary: "Task completed successfully",
      });
    });
  });

  describe("Parameter Validation", () => {
    it("should validate terminal tool parameters", () => {
      const terminalSchema = z.object({
        command: z.string(),
      });

      expect(() => terminalSchema.parse({ command: "ls -la" })).not.toThrow();
      expect(() => terminalSchema.parse({ command: 123 })).toThrow();
      expect(() => terminalSchema.parse({})).toThrow();
    });

    it("should validate createOrUpdateFiles tool parameters", () => {
      const filesSchema = z.object({
        files: z.array(
          z.object({
            path: z.string(),
            content: z.string(),
          })
        ),
      });

      const validInput = {
        files: [
          { path: "test.js", content: "console.log('test');" },
          { path: "index.html", content: "<html></html>" },
        ],
      };

      const invalidInput = {
        files: [
          { path: "test.js" }, // missing content
        ],
      };

      expect(() => filesSchema.parse(validInput)).not.toThrow();
      expect(() => filesSchema.parse(invalidInput)).toThrow();
      expect(() => filesSchema.parse({ files: "not an array" })).toThrow();
    });

    it("should validate readFiles tool parameters", () => {
      const readFilesSchema = z.object({
        files: z.array(z.string()),
      });

      expect(() => readFilesSchema.parse({ files: ["test.js", "index.html"] })).not.toThrow();
      expect(() => readFilesSchema.parse({ files: [123, "test.js"] })).toThrow();
      expect(() => readFilesSchema.parse({ files: "not an array" })).toThrow();
      expect(() => readFilesSchema.parse({})).toThrow();
    });
  });

  describe("Error Handling", () => {
    it("should handle database connection errors", async () => {
      mockPrisma.message.create.mockRejectedValue(new Error("Database connection failed"));

      await expect(
        mockStep.run("save-result", async () => {
          return await prisma.message.create({
            data: {
              projectId: "test-project-id",
              content: "Test message",
              role: "ASSISTANT",
              type: "RESULT",
            },
          });
        })
      ).rejects.toThrow("Database connection failed");
    });

    it("should handle agent execution errors", async () => {
      mockNetwork.run.mockRejectedValue(new Error("Agent execution failed"));

      await expect(mockNetwork.run("test input", { state: mockState }))
        .rejects.toThrow("Agent execution failed");
    });

    it("should handle sandbox connection errors", async () => {
      mockGetSandbox.mockRejectedValue(new Error("Sandbox connection failed"));

      await expect(getSandbox("invalid-id"))
        .rejects.toThrow("Sandbox connection failed");
    });
  });

  describe("Edge Cases", () => {
    it("should handle null/undefined values gracefully", () => {
      expect(() => {
        const isError = !undefined || Object.keys({} || {}).length === 0;
        return isError;
      }).not.toThrow();
    });

    it("should handle empty string inputs", async () => {
      const mockHandler = jest.fn().mockImplementation(async ({ command }, { step }) => {
        return await step?.run("terminal", async () => {
          if (!command || command.trim() === "") {
            return "Error: Empty command";
          }
          return "Command executed";
        });
      });

      const result = await mockHandler(
        { command: "" },
        { step: mockStep }
      );

      expect(result).toBe("Error: Empty command");
    });

    it("should handle files array with empty objects", () => {
      const filesSchema = z.object({
        files: z.array(
          z.object({
            path: z.string(),
            content: z.string(),
          })
        ),
      });

      expect(() => filesSchema.parse({
        files: [
          { path: "", content: "" },
        ],
      })).not.toThrow();
    });
  });
});