"use client";

import { motion } from "framer-motion";
import { AvatarOtto } from "./AvatarOtto";

export function TypingIndicator() {
  const bubbles = [
    { size: "h-2.5 w-2.5", delay: 0, x: 0 },
    { size: "h-3.5 w-3.5", delay: 0.12, x: 3 },
    { size: "h-2 w-2", delay: 0.24, x: -2 },
  ];

  return (
    <div className="flex items-end gap-3">
      <AvatarOtto isTyping />
      <div className="rounded-2xl border border-[#E5E7EB] bg-[#F8FAFC] px-4 py-3 shadow-sm">
        <div className="flex items-end gap-1.5">
          {bubbles.map((bubble, i) => (
            <motion.span
              key={i}
              className={`${bubble.size} rounded-full border border-[#FF6200]/35 bg-[#FFF7F2]`}
              animate={{
                y: [0, -7, 0],
                x: [0, bubble.x, 0],
                opacity: [0.5, 0.95, 0.5],
                scale: [0.92, 1.06, 0.92],
              }}
              transition={{ duration: 1.1, repeat: Infinity, delay: bubble.delay, ease: "easeInOut" }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
