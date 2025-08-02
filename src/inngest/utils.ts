import {Sandbox } from "@e2b/code-interpreter";
import { AgentResult, TextMessage } from "@inngest/agent-kit";

/**
 * Connects to a sandbox instance using the specified sandbox ID.
 *
 * @param sandboxId - The unique identifier of the sandbox to connect to
 * @returns A promise that resolves to the connected sandbox instance
 */
export async function getSandbox(sandboxId: string) {
    const sandbox = await Sandbox.connect(sandboxId)
    return sandbox
}

/**
 * Retrieves the content of the last assistant message from an AgentResult.
 *
 * If the last assistant message's content is a string, returns it directly. If the content is an array of text chunks, concatenates their text values. Returns `undefined` if no assistant message or content is found.
 *
 * @param result - The AgentResult containing output messages
 * @returns The content of the last assistant message, or `undefined` if not found
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