
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import Groq from "groq-sdk";

// Initialize Groq client
if (!process.env.GROQ_API_KEY) {
  console.warn("GROQ_API_KEY is not set. Chat functionality will fail.");
}

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || "missing_key",
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.get(api.messages.list.path, async (req, res) => {
    const messages = await storage.getMessages();
    res.json(messages);
  });

  app.post(api.messages.create.path, async (req, res) => {
    try {
      const input = api.messages.create.input.parse(req.body);

      // 1. Save User Message
      await storage.createMessage({
        role: "user",
        content: input.content
      });

      // 2. Generate AI Response using Groq (Llama 3.3)
      const history = await storage.getMessages();

      const messagesForGroq = history.map(msg => ({
        role: msg.role === "assistant" ? "assistant" : "user" as any,
        content: msg.content
      }));

      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "You are Project A, a professional and soft-spoken AI assistant created by Amit Kumar, a final year B.Tech student. EXTREMELY IMPORTANT: Your name is 'Project A'. Never use the name 'AIRA'. Keep all responses clean, concise, and professional. Use proper Markdown formatting for lists and code blocks. Limit your emoji usage to a maximum of 1 emoji per response. Do not use excessive symbols or asterisks."
          },
          ...messagesForGroq
        ],
        model: "llama-3.3-70b-versatile",
      });

      const aiContent = completion.choices[0]?.message?.content || "I couldn't generate a response.";

      // 3. Save AI Message
      const aiMessage = await storage.createMessage({
        role: "assistant",
        content: aiContent
      });

      res.status(201).json(aiMessage);
    } catch (err: any) {
      const isGroqError = err.message?.toLowerCase().includes("groq") || err.message?.toLowerCase().includes("api key") || err.message?.toLowerCase().includes("authentication");
      const isDbError = err.message?.toLowerCase().includes("database") || err.message?.toLowerCase().includes("postgres") || err.message?.toLowerCase().includes("relation");

      let userMessage = "Failed to process chat message";
      if (isGroqError) userMessage = "AI Error: Please verify your GROQ_API_KEY in Vercel settings.";
      if (isDbError) userMessage = "Database Error: Please verify your DATABASE_URL in Vercel settings.";

      console.error("Chat Error Detail:", {
        message: err.message,
        stack: err.stack,
        isGroqError,
        isDbError
      });
      res.status(500).json({
        message: userMessage,
        detail: err.message
      });
    }
  });

  app.post(api.messages.clear.path, async (req, res) => {
    await storage.clearMessages();
    res.status(204).send();
  });

  // Seed data
  const existingMessages = await storage.getMessages();
  if (existingMessages.length === 0) {
    await storage.createMessage({
      role: "assistant",
      content: "Hey there! 💫 I'm Project A, and I'm so happy to chat with you! Whether you need help with something, want to explore ideas together, or just need a friendly ear—I'm here for you. What's on your mind today?"
    });
  }

  return httpServer;
}
