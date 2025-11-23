import { Router, Request, Response } from "express";
import { bedrockClient } from "./bedrockClient";
import { InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

const router = Router();

// In-memory storage for chat history
const chatHistory: {
  timestamp: string;
  userMessage: string;
  botReply: string;
}[] = [];

router.post("/chatbot", async (req: Request, res: Response) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ reply: "Message is required." });

  try {
    const command = new InvokeModelCommand({
      modelId: "anthropic.claude-3-haiku-20240307-v1:0",
      contentType: "application/json",
      body: JSON.stringify({
        anthropic_version: "bedrock-2023-05-31",
        messages: [{ role: "user", content: [{ type: "text", text: message }] }],
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    const response = await bedrockClient.send(command);
    const raw = response.body as Uint8Array;
    const decoded = Buffer.from(raw).toString("utf-8");
    const data = JSON.parse(decoded);
    const reply =
      data?.content?.[0]?.text ||
      data?.messages?.[0]?.content?.[0]?.text ||
      "I'm here to help!";

    // Save entry to chat history
    chatHistory.push({
      timestamp: new Date().toISOString(),
      userMessage: message,
      botReply: reply,
    });

    res.json({ reply });
  } catch (err: any) {
    console.error("❌ Bedrock error:", err);
    res.status(500).json({ reply: "Sorry, I couldn't respond right now." });
  }
});

// Route to view chat history in tabular form
router.get("/history", (req: Request, res: Response) => {
  let html = `<h2>Chat History</h2><table border="1" cellpadding="5" cellspacing="0">
    <tr><th>Timestamp</th><th>User Message</th><th>Bot Reply</th></tr>`;

  chatHistory.forEach((entry) => {
    html += `<tr>
      <td>${entry.timestamp}</td>
      <td>${entry.userMessage}</td>
      <td>${entry.botReply}</td>
    </tr>`;
  });

  html += `</table>`;
  res.send(html);
});

export default router;
