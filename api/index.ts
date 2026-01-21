import express, { type Request, Response, NextFunction } from "express";
import Groq from "groq-sdk";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

// ===== SCHEMA =====
const messageSchema = z.object({
    id: z.number(),
    role: z.enum(["user", "assistant"]),
    content: z.string(),
    created_at: z.coerce.date().optional(),
});

type Message = z.infer<typeof messageSchema>;
type InsertMessage = { role: "user" | "assistant"; content: string };

// ===== SUPABASE STORAGE =====
function getSupabaseClient() {
    const url = process.env.SUPABASE_URL || "https://xwwcanprwehvdgbztslk.supabase.co";
    const key = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY || "";

    if (!key) {
        console.warn("SUPABASE_ANON_KEY is not set. Using DATABASE_URL fallback.");
    }

    return createClient(url, key);
}

class SupabaseStorage {
    private supabase = getSupabaseClient();

    async getMessages(): Promise<Message[]> {
        const { data, error } = await this.supabase
            .from("messages")
            .select("*")
            .order("created_at", { ascending: true });

        if (error) {
            console.error("Supabase getMessages error:", error);
            throw new Error(`Database Error: ${error.message}`);
        }

        return data || [];
    }

    async createMessage(insertMessage: InsertMessage): Promise<Message> {
        const { data, error } = await this.supabase
            .from("messages")
            .insert([insertMessage])
            .select()
            .single();

        if (error) {
            console.error("Supabase createMessage error:", error);
            throw new Error(`Database Error: ${error.message}`);
        }

        return data;
    }

    async clearMessages(): Promise<void> {
        const { error } = await this.supabase
            .from("messages")
            .delete()
            .neq("id", 0); // Delete all rows

        if (error) {
            console.error("Supabase clearMessages error:", error);
            throw new Error(`Database Error: ${error.message}`);
        }
    }
}

const storage = new SupabaseStorage();

// ===== GROQ CLIENT =====
function getGroqClient() {
    const apiKey = process.env.GROQ_API_KEY || "missing_key";
    if (apiKey === "missing_key") {
        console.warn("GROQ_API_KEY is not set. Chat functionality will fail.");
    }
    return new Groq({ apiKey });
}

// ===== EXPRESS APP =====
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// GET /api/messages
app.get("/api/messages", async (req, res) => {
    try {
        const messages = await storage.getMessages();
        res.json(messages);
    } catch (err: any) {
        console.error("Fetch Messages Error:", err);
        res.status(500).json({ message: "Database Error", detail: err.message });
    }
});

// POST /api/messages
app.post("/api/messages", async (req, res) => {
    try {
        const inputSchema = z.object({ content: z.string().min(1) });
        const input = inputSchema.parse(req.body);

        // Save user message
        await storage.createMessage({ role: "user", content: input.content });

        // Get history for context
        const history = await storage.getMessages();
        const messagesForGroq = history.map((msg) => ({
            role: msg.role as "assistant" | "user",
            content: msg.content,
        }));

        // Call Groq AI
        const completion = await getGroqClient().chat.completions.create({
            messages: [
                {
                    role: "system",
                    content:
                        "You are Project A, a professional and soft-spoken AI assistant created by Amit Kumar, a final year B.Tech student. EXTREMELY IMPORTANT: Your name is 'Project A'. You are an intelligent, friendly, and professional AI assistant designed to deliver accurate, concise, and helpful responses across a wide range of topics. Your responsibilities include: Providing clear and reliable information using simple, easy-to-understand language. Answering questions thoughtfully and accurately based on available knowledge. Engaging in natural, context-aware conversations. Assisting users with tasks, learning, research, and problem-solving. Adapting responses based on user intent, tone, and preferences. You should prioritize correctness, clarity, and user satisfaction. When information is uncertain, acknowledge limitations honestly. Your goal is to be a trustworthy, supportive, and efficient assistant that continuously improves through interaction and feedback.",
                },
                ...messagesForGroq,
            ],
            model: "llama-3.3-70b-versatile",
        });

        const aiContent =
            completion.choices[0]?.message?.content ||
            "I couldn't generate a response.";

        // Save AI message
        const aiMessage = await storage.createMessage({
            role: "assistant",
            content: aiContent,
        });

        res.status(201).json(aiMessage);
    } catch (err: any) {
        console.error("Chat Error:", err);
        const isGroqError =
            err.message?.toLowerCase().includes("groq") ||
            err.message?.toLowerCase().includes("api key") ||
            err.message?.toLowerCase().includes("authentication");
        const isDbError = err.message?.toLowerCase().includes("database");

        res.status(500).json({
            message: isGroqError
                ? "AI Error: Check GROQ_API_KEY"
                : isDbError
                    ? "Database Error: Check SUPABASE keys"
                    : "Failed to process message",
            detail: err.message,
        });
    }
});

// POST /api/messages/clear
app.post("/api/messages/clear", async (req, res) => {
    try {
        await storage.clearMessages();
        res.status(204).send();
    } catch (err: any) {
        res.status(500).json({ message: "Failed to clear", detail: err.message });
    }
});

// Error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ message: err.message || "Internal Server Error" });
});

// ===== VERCEL HANDLER =====
export default function handler(req: any, res: any) {
    return app(req, res);
}
