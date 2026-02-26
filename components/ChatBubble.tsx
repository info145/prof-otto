"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { MessageWithMath } from "./MessageWithMath";
import { AvatarOtto } from "./AvatarOtto";
import { GraphCard } from "./GraphCard";
import type { GraphSpec } from "@/lib/graph-spec";
import { RenderGuard } from "./RenderGuard";

type ChatBubbleProps = {
  role: "user" | "assistant";
  content: string;
  isImage?: boolean;
  imageUrl?: string;
  graphSpec?: GraphSpec;
  showAvatar?: boolean;
  isTyping?: boolean;
};

export function ChatBubble({
  role,
  content,
  isImage,
  imageUrl,
  graphSpec,
  showAvatar = true,
  isTyping = false,
}: ChatBubbleProps) {
  const isUser = role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.985, y: 6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={cn("flex gap-3 text-sm", isUser ? "justify-end" : "justify-start")}
    >
      {!isUser && showAvatar && (
        <AvatarOtto isTyping={isTyping} />
      )}
      <div
        className={cn(
          "max-w-[76%] px-5 py-3.5 text-[15px] leading-relaxed shadow-sm",
          isUser
            ? "rounded-tl-3xl rounded-tr-none rounded-bl-3xl rounded-br-3xl bg-[#FF6200] font-medium text-white"
            : "rounded-2xl border border-[#E5E7EB] bg-[#F8FAFC] text-[#1F1F1F]"
        )}
      >
        {isImage && imageUrl ? (
          <div className="overflow-hidden rounded-xl">
            <img src={imageUrl} alt="Allegato" className="max-h-64 w-full object-cover" />
            {content ? (
              <div className="mt-2 border-t border-border pt-2">
                <MessageWithMath content={content} />
              </div>
            ) : null}
            {!isUser && graphSpec ? (
              <RenderGuard
                fallback={
                  <div className="mt-3 rounded-xl border border-[#E5E7EB] bg-white/80 px-3 py-2 text-xs text-[#6B7280]">
                    Grafico non disponibile per questo messaggio.
                  </div>
                }
              >
                <GraphCard spec={graphSpec} />
              </RenderGuard>
            ) : null}
          </div>
        ) : (
          <>
            <MessageWithMath content={content} />
            {!isUser && graphSpec ? (
              <RenderGuard
                fallback={
                  <div className="mt-3 rounded-xl border border-[#E5E7EB] bg-white/80 px-3 py-2 text-xs text-[#6B7280]">
                    Grafico non disponibile per questo messaggio.
                  </div>
                }
              >
                <GraphCard spec={graphSpec} />
              </RenderGuard>
            ) : null}
          </>
        )}
      </div>
      {isUser && (
        <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-[#E5E5E5] text-xs font-semibold text-[#1A1A1A]">
          Tu
        </div>
      )}
    </motion.div>
  );
}
