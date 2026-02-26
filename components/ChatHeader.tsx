"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AvatarOtto } from "@/components/AvatarOtto";

type ChatHeaderProps = {
  onClearChat?: () => void;
  hasMessages?: boolean;
};

export function ChatHeader({ onClearChat, hasMessages = false }: ChatHeaderProps) {
  return (
    <div className="flex items-center justify-between border-b border-[#EDEDED] bg-white/90 px-6 py-4 backdrop-blur-sm">
      <div className="flex min-w-0 items-center gap-4">
        <img
          src="https://mentor-ripetizioni.com/wp-content/uploads/2025/08/mentor.webp"
          alt="Mentor"
          className="h-auto w-[170px] max-w-[45vw] object-contain"
        />
        <div className="hidden h-8 w-px bg-[#EDEDED] md:block" />
        <div className="hidden items-center gap-2 md:flex">
          <AvatarOtto />
          <p className="text-sm font-semibold text-[#1F1F1F]">Prof Otto</p>
          <Badge className="bg-[#FF6200] text-white">BETA</Badge>
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
