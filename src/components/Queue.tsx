"use client";

import { useState, useRef } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/8bit/card";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@/components/ui/8bit/avatar";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useQueue } from "@/contexts/QueueContext";

interface QueueSong {
  id: string;
  title: string;
  artist: string;
  thumbnail?: string;
}

interface QueueCardProps {
  song: QueueSong;
  index: number;
  onRemove: (index: number) => void;
}

function QueueCard({ song, index, onRemove }: QueueCardProps) {
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const startY = useRef(0);
  const SWIPE_THRESHOLD = -60;

  const handlePointerDown = (e: React.PointerEvent) => {
    startY.current = e.clientY;
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const deltaY = e.clientY - startY.current;
    // Only allow upward drag
    if (deltaY < 0) {
      setDragY(deltaY);
    }
  };

  const handlePointerUp = async () => {
    if (!isDragging) return;
    setIsDragging(false);

    if (dragY < SWIPE_THRESHOLD) {
      // Animate out and remove
      setIsRemoving(true);
      await new Promise((resolve) => setTimeout(resolve, 200));
      onRemove(index);
    } else {
      // Snap back
      setDragY(0);
    }
  };

  if (isRemoving) {
    return (
      <div
        className="flex flex-col items-center space-y-2 transition-all duration-200"
        style={{
          opacity: 0,
          transform: "translateY(-100px) scale(0.8)",
        }}
      >
        <div className="w-20 h-20" />
      </div>
    );
  }

  return (
    <div
      className="flex flex-col items-center space-y-2 cursor-grab active:cursor-grabbing select-none touch-none"
      style={{
        transform: `translateY(${dragY}px)`,
        opacity: isDragging ? 1 - Math.abs(dragY) / 150 : 1,
        transition: isDragging ? "none" : "transform 0.2s, opacity 0.2s",
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div className="relative">
        <Avatar className="w-20 h-20" variant="pixel">
          <AvatarImage
            src={song.thumbnail || `https://i.pravatar.cc/150?u=${song.id}`}
            alt={song.artist}
          />
          <AvatarFallback>{song.artist?.[0] || "?"}</AvatarFallback>
        </Avatar>
      </div>
      <div className="text-center max-w-24">
        <p className="text-xs retro break-words">{song.title}</p>
        <p className="text-xs text-muted-foreground retro break-words">
          {song.artist}
        </p>
      </div>
    </div>
  );
}

interface QueueProps {
  className?: string;
}

const VISIBLE_COUNT = 4;

export default function Queue({ className }: QueueProps) {
  const { queue, isLoading, removeFromQueue } = useQueue();
  const [startIndex, setStartIndex] = useState(0);

  const canScrollLeft = startIndex > 0;
  const canScrollRight = startIndex + VISIBLE_COUNT < queue.length;

  const visibleQueue = queue.slice(startIndex, startIndex + VISIBLE_COUNT);

  const handleRemove = async (queueIndex: number) => {
    await removeFromQueue(queueIndex);
  };

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Up Next
            {isLoading && <span className="text-xs ml-2">(Loading...)</span>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {queue.length === 0 && !isLoading ? (
            <div className="text-center text-muted-foreground text-sm retro py-4">
              No songs in queue. Use /search to add songs!
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setStartIndex((i) => Math.max(0, i - 1))}
                disabled={!canScrollLeft}
                className="p-1 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-muted rounded"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="flex space-x-3 flex-1 justify-center">
                {visibleQueue.map((song, visualIndex) => (
                  <QueueCard
                    key={song.id}
                    song={song}
                    index={startIndex + visualIndex}
                    onRemove={handleRemove}
                  />
                ))}
              </div>
              <button
                onClick={() => setStartIndex((i) => Math.min(queue.length - VISIBLE_COUNT, i + 1))}
                disabled={!canScrollRight}
                className="p-1 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-muted rounded"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
