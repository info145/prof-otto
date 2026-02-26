"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";

type CanvasDrawModalProps = {
  open: boolean;
  onClose: () => void;
  onSendImage: (dataUrl: string) => void;
};

export function CanvasDrawModal({ open, onClose, onSendImage }: CanvasDrawModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);

  if (!open) return null;

  const start = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#1A1A1A";
    setDrawing(true);
  };

  const move = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!drawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stop = () => setDrawing(false);

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const send = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    onSendImage(canvas.toDataURL("image/png"));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25">
      <div className="w-[90vw] max-w-3xl rounded-2xl border border-border bg-white p-4 shadow-soft-md">
        <canvas
          ref={canvasRef}
          width={1000}
          height={600}
          onMouseDown={start}
          onMouseMove={move}
          onMouseUp={stop}
          onMouseLeave={stop}
          className="h-[60vh] w-full rounded-xl border border-border bg-white"
        />
        <div className="mt-3 flex justify-end gap-2">
          <Button variant="outline" onClick={clear}>
            Pulisci
          </Button>
          <Button variant="outline" onClick={onClose}>
            Chiudi
          </Button>
          <Button onClick={send}>Invia</Button>
        </div>
      </div>
    </div>
  );
}
