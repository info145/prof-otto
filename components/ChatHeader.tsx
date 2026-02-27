"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Menu } from "lucide-react";

type ChatHeaderProps = {
  onClearChat?: () => void;
  hasMessages?: boolean;
  onOpenSidebar?: () => void;
};

export function ChatHeader({ onClearChat, hasMessages = false, onOpenSidebar }: ChatHeaderProps) {
  return (
    <div className="flex items-center justify-between border-b border-[#EDEDED] bg-white/90 px-3 py-2.5 backdrop-blur-sm md:px-6 md:py-4">
      <div className="flex min-w-0 items-center gap-2 md:gap-4">
        {onOpenSidebar && (
          <button
            type="button"
            onClick={onOpenSidebar}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#1F1F1F] transition hover:bg-[#FFF0E6] lg:hidden"
            aria-label="Apri chat"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        <div className="flex w-[130px] shrink-0 flex-col gap-0.5 md:w-[170px]">
          <img
            src="https://mentor-ripetizioni.com/wp-content/uploads/2025/08/mentor.webp"
            alt="Mentor"
            className="h-auto w-full object-contain"
          />
          <span className="mx-auto w-[115px] text-center text-[9px] font-medium leading-tight text-mentor-orange md:w-[150px] md:text-[11px]">
            la guida che ogni studente merita.
          </span>
        </div>
        <div className="flex items-center gap-1 md:hidden">
          <Badge className="h-6 bg-[#FF6200] px-2 text-[10px] text-white">BETA</Badge>
          <span className="text-[10px] font-semibold text-[#6B7280]">1.2</span>
        </div>
        <div className="hidden h-8 w-px bg-[#EDEDED] md:block" />
        <div className="hidden items-center gap-2 md:flex">
          <p className="text-sm font-semibold text-[#1F1F1F]">Prof Otto</p>
          <Badge className="bg-[#FF6200] text-white">BETA</Badge>
          <span className="text-xs font-semibold text-[#6B7280]">1.2</span>
        </div>
      </div>
      {onClearChat && (
        <Button
          variant="outline"
          size="sm"
          onClick={onClearChat}
          disabled={!hasMessages}
          className="mentor-title h-8 rounded-full border-[#EDEDED] px-3 text-xs hover:border-[#FF6200]/35 hover:bg-[#FFF4EC] md:h-9 md:px-4 md:text-sm"
        >
          Pulisci
        </Button>
      )}
    </div>
  );
}
