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
      className={cn("flex gap-2 text-sm md:gap-3", isUser ? "justify-end" : "justify-start")}
    >
      {!isUser && showAvatar && (
        <AvatarOtto isTyping={isTyping} />
      )}
      <div
        className={cn(
          "max-w-[84%] px-3 py-2.5 text-[14px] leading-relaxed shadow-sm md:max-w-[76%] md:px-5 md:py-3.5 md:text-[15px]",
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
        <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full border border-[#E5E5E5] bg-white md:h-16 md:w-16">
          <img src="/Einstein.jpg" alt="Profilo studente" className="h-full w-full object-cover" />
        </div>
      )}
    </motion.div>
  );
}
