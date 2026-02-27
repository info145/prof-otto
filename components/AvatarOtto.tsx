"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const OTTO_AVATAR_URL =
  "https://mentor-ripetizioni.com/wp-content/uploads/2025/08/OTTO-MASCOTTE-04-768x687.png";

type AvatarOttoProps = {
  isTyping?: boolean;
  className?: string;
};

export function AvatarOtto({ isTyping = false, className }: AvatarOttoProps) {
  return (
    <motion.div
      animate={isTyping ? { y: [0, -3, 0] } : { y: 0 }}
      transition={isTyping ? { duration: 0.9, repeat: Infinity, ease: "easeInOut" } : undefined}
      className={cn("shadow-sm", className)}
    >
      <img
        src={OTTO_AVATAR_URL}
        alt="Prof Otto"
        className="h-10 w-10 object-contain object-center md:h-16 md:w-16"
      />
    </motion.div>
  );
}
