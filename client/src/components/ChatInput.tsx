import { useState, useRef, useEffect } from "react";
import { Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [input]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || disabled) return;
    onSend(input);
    setInput("");

    // Reset height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="bg-background/80 backdrop-blur-md border-t border-border/50 p-4 md:p-6 pb-6 md:pb-8 sticky bottom-0 z-10">
      <div className="max-w-3xl mx-auto relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-blue-500/20 to-purple-500/20 rounded-2xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 blur-xl pointer-events-none" />

        <form
          onSubmit={handleSubmit}
          className="relative flex items-end gap-2 bg-card rounded-2xl border border-border shadow-lg shadow-black/5 p-2 ring-offset-2 focus-within:ring-2 ring-primary/20 transition-all duration-300"
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything..."
            disabled={disabled}
            rows={1}
            className="flex-1 max-h-[150px] min-h-[44px] py-3 px-4 bg-transparent border-none resize-none focus:outline-none placeholder:text-muted-foreground text-foreground rounded-xl"
          />

          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || disabled}
            className="h-10 w-10 shrink-0 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm transition-all duration-200 disabled:opacity-50"
          >
            {disabled ? (
              <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Send className="h-4 w-4 ml-0.5" />
            )}
          </Button>
        </form>

        <div className="text-center mt-3">
          <p className="text-[10px] md:text-xs text-muted-foreground flex items-center justify-center gap-1.5 opacity-70">
            <Sparkles className="w-3 h-3 text-primary" />
            I try my best, but please double-check important details
          </p>
        </div>
      </div>
    </div>
  );
}
