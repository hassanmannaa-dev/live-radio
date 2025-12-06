"use client";

import { useState } from "react";
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

interface QueueProps {
  className?: string;
}

const VISIBLE_COUNT = 4;

export default function Queue({ className }: QueueProps) {
  const { queue, isLoading } = useQueue();
  const [startIndex, setStartIndex] = useState(0);

  const canScrollLeft = startIndex > 0;
  const canScrollRight = startIndex + VISIBLE_COUNT < queue.length;

  const visibleQueue = queue.slice(startIndex, startIndex + VISIBLE_COUNT);
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
                {visibleQueue.map((song) => (
                  <div
                    key={song.id}
                    className="flex flex-col items-center space-y-2"
                  >
                    <div className="relative">
                      <Avatar className="w-20 h-20" variant="pixel">
                        <AvatarImage
                          src={
                            song.thumbnail ||
                            `https://i.pravatar.cc/150?u=${song.id}`
                          }
                          alt={song.artist}
                        />
                        <AvatarFallback>{song.artist?.[0] || "?"}</AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="text-center max-w-24">
                      <p className="text-xs retro break-words">
                        {song.title}
                      </p>
                      <p className="text-xs text-muted-foreground retro break-words">
                        {song.artist}
                      </p>
                    </div>
                  </div>
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
