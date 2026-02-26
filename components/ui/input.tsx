"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-11 w-full rounded-2xl border border-[#EDEDED] bg-white px-4 text-sm text-[#1F1F1F] placeholder:text-[#9CA3AF] outline-none focus:border-[#FF6200]/40",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";
