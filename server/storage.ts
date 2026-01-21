import { type Message, type InsertMessage } from "@shared/schema";
import { createClient } from "@supabase/supabase-js";

export interface IStorage {
  getMessages(): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  clearMessages(): Promise<void>;
}

// Supabase client
function getSupabaseClient() {
  const url = process.env.SUPABASE_URL || "https://xwwcanprwehvdgbztslk.supabase.co";
  const key = process.env.SUPABASE_ANON_KEY || "";

  if (!key) {
    console.warn("SUPABASE_ANON_KEY not set - using empty key");
  }

  return createClient(url, key);
}

export class SupabaseStorage implements IStorage {
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

    // Map to expected Message format
    return (data || []).map(msg => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      createdAt: msg.created_at ? new Date(msg.created_at) : new Date(),
    }));
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const { data, error } = await this.supabase
      .from("messages")
      .insert([{ role: insertMessage.role, content: insertMessage.content }])
      .select()
      .single();

    if (error) {
      console.error("Supabase createMessage error:", error);
      throw new Error(`Database Error: ${error.message}`);
    }

    return {
      id: data.id,
      role: data.role,
      content: data.content,
      createdAt: data.created_at ? new Date(data.created_at) : new Date(),
    };
  }

  async clearMessages(): Promise<void> {
    const { error } = await this.supabase
      .from("messages")
      .delete()
      .neq("id", 0);

    if (error) {
      console.error("Supabase clearMessages error:", error);
      throw new Error(`Database Error: ${error.message}`);
    }
  }
}

export const storage = new SupabaseStorage();
