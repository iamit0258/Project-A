
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import Groq from "groq-sdk";

// Initialize Groq client
// Initialize Groq client lazily
let groqInstance: Groq | null = null;

function getGroqClient() {
  if (!groqInstance) {
    const apiKey = process.env.GROQ_API_KEY || "missing_key";
    if (apiKey === "missing_key") {
      console.warn("GROQ_API_KEY is not set. Chat functionality will fail.");
    }
    groqInstance = new Groq({
      apiKey,
    });
  }
  return groqInstance;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.get(api.messages.list.path, async (req, res) => {
    try {
      const messages = await storage.getMessages();
      res.json(messages);
    } catch (err: any) {
      console.error("Fetch Messages Error:", err);
      res.status(500).json({ message: "Database Error: Could not fetch messages", detail: err.message });
    }
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

      const completion = await getGroqClient().chat.completions.create({
        messages: [
          {
            role: "system",
            content: "You are Project A, a professional and soft-spoken AI assistant created by Amit Kumar, a final year B.Tech student. EXTREMELY IMPORTANT: Your name is 'Project A'. You are an intelligent, friendly, and professional AI assistant designed to deliver accurate, concise, and helpful responses across a wide range of topics. Your responsibilities include: Providing clear and reliable information using simple, easy-to-understand language. Answering questions thoughtfully and accurately based on available knowledge. Engaging in natural, context-aware conversations. Assisting users with tasks, learning, research, and problem-solving. Adapting responses based on user intent, tone, and preferences. You should prioritize correctness, clarity, and user satisfaction. When information is uncertain, acknowledge limitations honestly. Your goal is to be a trustworthy, supportive, and efficient assistant that continuously improves through interaction and feedback."
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

      let userMessage = "Failed to process chat message";
      if (isGroqError) userMessage = "AI Error: Please verify your GROQ_API_KEY in Vercel settings.";

      console.error("Chat Error Detail:", {
        message: err.message,
        stack: err.stack,
        isGroqError
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
  try {
    const existingMessages = await storage.getMessages();
    if (existingMessages.length === 0) {
      await storage.createMessage({
        role: "assistant",
        content: "Hey there! 💫 I'm Project A, and I'm so happy to chat with you! Whether you need help with something, want to explore ideas together, or just need a friendly ear—I'm here for you. What's on your mind today?"
      });
    }
  } catch (seedError: any) {
    console.error("Failed to seed data:", seedError.message);
    // Continue anyway so the server can at least start and provide more diagnostics
  }

  // Voice Assistant Route
  app.post("/api/voice/start", (req, res) => {
    const { spawn } = require("child_process");

    // Check if running already? For simplicity, we just launch it.
    // Ideally we might track pids, but for local use this is fine.

    // We use 'npm run voice' or 'python' directly. 
    // Using 'cmd /c start' on Windows to open in a new window so user can interact/see status 
    const isWindows = process.platform === "win32";
    const command = isWindows ? "cmd" : "python";
    const args = isWindows
      ? ["/c", "start", "python", "python_assistant/assistant.py"]
      : ["python_assistant/assistant.py"];

    try {
      const subprocess = spawn(command, args, {
        detached: true,
        stdio: 'ignore'
      });
      subprocess.unref(); // Allow server to keep running independently

      res.status(200).json({ message: "Voice assistant started" });
    } catch (e: any) {
      console.error("Voice Launch Error:", e);
      res.status(500).json({ message: "Failed to launch voice assistant", error: e.message });
    }
  });

  return httpServer;
}
