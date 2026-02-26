"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("rounded-3xl border border-[#EDEDED] bg-white/80 shadow-sm backdrop-blur-md", className)}
      {...props}
    />
  )
);
Card.displayName = "Card";
