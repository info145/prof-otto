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
    <div className="flex items-center justify-between border-b border-[#EDEDED] bg-white/90 px-4 py-4 backdrop-blur-sm md:px-6">
      <div className="flex min-w-0 items-center gap-4">
        {onOpenSidebar && (
          <button
            type="button"
            onClick={onOpenSidebar}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#1F1F1F] transition hover:bg-[#FFF0E6] lg:hidden"
            aria-label="Apri chat"
          >
            <Menu className="h-6 w-6" />
          </button>
        )}
        <div className="flex flex-col gap-0.5">
          <img
            src="https://mentor-ripetizioni.com/wp-content/uploads/2025/08/mentor.webp"
            alt="Mentor"
            className="h-auto w-[170px] max-w-[45vw] object-contain"
          />
          <span className="text-xs font-medium text-mentor-orange">
            la guida che ogni studente merita
          </span>
        </div>
        <div className="hidden h-8 w-px bg-[#EDEDED] md:block" />
        <div className="hidden items-center gap-2 md:flex">
          <p className="text-sm font-semibold text-[#1F1F1F]">Prof Otto</p>
          <Badge className="bg-[#FF6200] text-white">BETA</Badge>
          <span className="text-xs font-semibold text-[#6B7280]">1.0</span>
        </div>
      </div>
      {onClearChat && (
        <Button
          variant="outline"
          size="sm"
          onClick={onClearChat}
          disabled={!hasMessages}
          className="rounded-full border-[#EDEDED] hover:border-[#FF6200]/35 hover:bg-[#FFF4EC]"
        >
          Pulisci
        </Button>
      )}
    </div>
  );
}
