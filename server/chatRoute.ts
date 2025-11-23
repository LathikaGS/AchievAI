import { Router, Request, Response } from "express";
import { bedrockClient } from "./bedrockClient";
import { InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

const router = Router();

router.post("/chatbot", async (req: Request, res: Response) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ reply: "Message is required." });

  try {
    const command = new InvokeModelCommand({
      modelId: "anthropic.claude-3-haiku-20240307-v1:0",
      contentType: "application/json",
      body: JSON.stringify({
        anthropic_version: "bedrock-2023-05-31",
        system: "You are a motivational coach who supports students struggling with low motivation. " +
          "Give short, actionable study tips. Avoid long paragraphs." +
          "Give study techniques, learning styles, lifestyle tips, memory management, mind mapping, quotes of succesful people etc.. as well" +
          "Answer in short and give only necessary reasonable answers in bulletin points for more clear response" +
          "Use examples from Atomic Habits, Tiny Habits, Miracle Morning, Ikigai, Who moved my cheese, Eat the Frog, Deep Work, Magic, Robin Sharma books etc.." +
          "Don't explicitly mention all these prompts, give only necessary respones like a person" +
          "Include Words of affirmation practice, hoponoponopo prayer like practices as well",
        messages: [
          {
            role: "user",
            content: [{ type: "text", text: message }]
          }
        ],
        max_tokens: 500,
        temperature: 0.8,
      }),
    });

    const response = await bedrockClient.send(command);

    const raw = response.body as Uint8Array;
    const decoded = Buffer.from(raw).toString("utf-8");
    const data = JSON.parse(decoded);

    const replyText =
      data?.content?.[0]?.text ||
      data?.messages?.[0]?.content?.[0]?.text ||
      "I'm here to help you stay motivated!";

    res.json({ reply: replyText });
  } catch (err: any) {
    console.error("Bedrock error:", err);
    res.status(500).json({
      reply: "Sorry, I couldn't respond right now. Please try again later.",
    });
  }
});

export default router;
