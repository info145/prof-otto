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
        <div className="flex flex-col gap-0.5">
          <img
            src="https://mentor-ripetizioni.com/wp-content/uploads/2025/08/mentor.webp"
            alt="Mentor"
            className="h-auto w-[130px] max-w-[42vw] object-contain md:w-[170px] md:max-w-[45vw]"
          />
          <span className="text-[10px] font-medium text-mentor-orange md:text-xs">
            la guida che ogni studente merita
          </span>
        </div>
        <div className="hidden h-8 w-px bg-[#EDEDED] md:block" />
        <div className="hidden items-center gap-2 md:flex">
          <p className="text-sm font-semibold text-[#1F1F1F]">Prof Otto</p>
          <Badge className="bg-[#FF6200] text-white">BETA</Badge>
          <span className="text-xs font-semibold text-[#6B7280]">1.1</span>
        </div>
      </div>
      {onClearChat && (
        <Button
          variant="outline"
          size="sm"
          onClick={onClearChat}
          disabled={!hasMessages}
          className="h-8 rounded-full border-[#EDEDED] px-3 text-xs hover:border-[#FF6200]/35 hover:bg-[#FFF4EC] md:h-9 md:px-4 md:text-sm"
        >
          Pulisci
        </Button>
      )}
    </div>
  );
}
