import { cn } from "@/lib/utils";
import { type Message } from "@shared/schema";
import { Bot, User, Copy, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface MessageBubbleProps {
  message: Message;
  isLast?: boolean;
}

export function MessageBubble({ message, isLast }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={cn(
        "flex w-full gap-3 md:gap-4 mb-6",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "flex h-8 w-8 md:h-10 md:w-10 shrink-0 items-center justify-center rounded-xl shadow-sm border",
          isUser
            ? "bg-primary text-primary-foreground border-primary/20"
            : "bg-card text-emerald-600 border-border"
        )}
      >
        {isUser ? (
          <User className="h-4 w-4 md:h-5 md:w-5" />
        ) : (
          <img src="/favicon.png" alt="Project A" className="h-full w-full object-cover rounded-xl" />
        )}
      </div>

      {/* Bubble */}
      <div
        className={cn(
          "relative group max-w-[85%] md:max-w-[75%] rounded-2xl px-4 py-3 md:px-5 md:py-4 shadow-sm text-sm md:text-base leading-relaxed",
          isUser
            ? "bg-primary text-primary-foreground rounded-tr-none"
            : "bg-card text-foreground border border-border/50 rounded-tl-none prose-custom"
        )}
      >
        {!isUser && (
          <div className={cn(
            "absolute top-2 opacity-0 group-hover:opacity-100 transition-opacity",
            isUser ? "left-2" : "right-2"
          )}>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-7 w-7 rounded-lg backdrop-blur-sm border border-border/50 shadow-sm",
                      isUser
                        ? "bg-white/20 hover:bg-white/30 border-white/20 text-white"
                        : "bg-white/50 hover:bg-white text-muted-foreground"
                    )}
                    onClick={handleCopy}
                  >
                    <AnimatePresence mode="wait">
                      {copied ? (
                        <motion.div
                          key="check"
                          initial={{ scale: 0.5, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.5, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Check className={cn("h-3.5 w-3.5", isUser ? "text-white" : "text-emerald-600")} />
                        </motion.div>
                      ) : (
                        <motion.div
                          key="copy"
                          initial={{ scale: 0.5, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.5, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p className="text-[10px] font-medium">Copy message</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
        <div>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              p: ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
              ul: ({ children }) => <ul className="list-disc ml-4 mb-2">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal ml-4 mb-2">{children}</ol>,
              li: ({ children }) => <li className="mb-1">{children}</li>,
              h1: ({ children }) => <h1 className="text-xl font-bold mb-1">{children}</h1>,
              h2: ({ children }) => <h2 className="text-lg font-bold mb-1">{children}</h2>,
              h3: ({ children }) => <h3 className="text-md font-bold mb-1">{children}</h3>,
              code: ({ children }) => <code className="bg-black/10 rounded px-1 py-0.5 font-mono text-sm">{children}</code>,
              pre: ({ children }) => <pre className="bg-black/10 rounded-lg p-3 overflow-x-auto my-2 font-mono text-sm">{children}</pre>,
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>

        {/* Time and Bottom Copy Button */}
        <div
          className={cn(
            "flex items-center justify-between mt-1 pt-1 border-t border-border/10",
            isUser ? "flex-row-reverse" : "flex-row"
          )}
        >
          <div
            className={cn(
              "text-[10px] opacity-50",
              isUser ? "text-primary-foreground/80" : "text-muted-foreground"
            )}
          >
            {message.createdAt && new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>

          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-6 gap-1 px-2 text-[10px] transition-colors",
              isUser
                ? "text-primary-foreground/70 hover:text-primary-foreground hover:bg-white/10"
                : "text-muted-foreground hover:text-foreground"
            )}
            onClick={handleCopy}
          >
            <AnimatePresence mode="wait">
              {copied ? (
                <motion.div
                  key="check-bottom"
                  className="flex items-center gap-1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Check className={cn("h-3 w-3", isUser ? "text-white" : "text-emerald-600")} />
                  <span>Copied!</span>
                </motion.div>
              ) : (
                <motion.div
                  key="copy-bottom"
                  className="flex items-center gap-1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Copy className="h-3 w-3" />
                  <span>Copy</span>
                </motion.div>
              )}
            </AnimatePresence>
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
