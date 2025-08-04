import {Sandbox } from "@e2b/code-interpreter";
import { AgentResult, type Message, TextMessage } from "@inngest/agent-kit";
import { SANDBOX_TIMEOUT } from "./types";

/**
 * Establishes and returns a connection to a sandbox instance using the provided sandbox ID.
 *
 * @param sandboxId - The unique identifier of the sandbox to connect to
 * @returns The connected sandbox instance
 */
export async function getSandbox(sandboxId: string) {
    const sandbox = await Sandbox.connect(sandboxId)
    await sandbox.setTimeout(SANDBOX_TIMEOUT);
    return sandbox
}

/**
 * Retrieves the content of the last assistant message from an agent result.
 *
 * If the assistant message content is an array of text chunks, their text fields are concatenated into a single string. Returns `undefined` if no assistant message or content is found.
 *
 * @param result - The agent result containing output messages
 * @returns The content of the last assistant message as a string, or `undefined` if not found
 */
export function lastAssistantTextMessageContent(result: AgentResult) {
    const lastAssistantTextMessageIndex = result.output.findLastIndex(
        (message) => message.role === "assistant"
    );
    const message = result.output[ lastAssistantTextMessageIndex ] as | TextMessage | undefined
    return message?.content
    ? typeof message.content === "string"
        ? message.content
            : message.content.map((chunk) => chunk.text).join("")
    : undefined
    
}

export const parseAgentOutput = (value: Message[]) => {
      const output = value[0];
      if (output.type !== "text") {
        return "Fragment";
      }

      if (Array.isArray(output.content)) {
        return output.content.map((txt) => txt).join("");
      } else {
        return output.content;
      }
    }