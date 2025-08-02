import { serve } from "inngest/next";
import { inngest } from "../../../inngest/client";
import { codingAgentFunction } from "../../../inngest/functions";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    codingAgentFunction, // <-- This is where you'll always add all your functions
  ],
});
