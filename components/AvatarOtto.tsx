"use client";

import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
      className={cn("rounded-full shadow-sm", className)}
    >
      <Avatar className="h-16 w-16 border-2 border-[#FFD9C2] bg-white">
        <AvatarImage src={OTTO_AVATAR_URL} alt="Prof Otto" className="object-contain object-center" />
        <AvatarFallback className="text-base">🐙</AvatarFallback>
      </Avatar>
    </motion.div>
  );
}
