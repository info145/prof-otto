"use client";

import { motion } from "framer-motion";
import { AvatarOtto } from "./AvatarOtto";

export function TypingIndicator() {
  return (
    <div className="flex items-end gap-3">
      <AvatarOtto isTyping />
      <div className="rounded-2xl border border-[#E5E7EB] bg-[#F8FAFC] px-4 py-3 shadow-sm">
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="h-2 w-2 rounded-full bg-[#FF6200]"
              animate={{ y: [0, -4, 0], opacity: [0.45, 1, 0.45] }}
              transition={{ duration: 0.75, repeat: Infinity, delay: i * 0.12 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
