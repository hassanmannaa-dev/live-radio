"use client";

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
import { useQueue } from "@/contexts/QueueContext";

interface QueueProps {
  className?: string;
}

export default function Queue({ className }: QueueProps) {
  const { queue, isLoading } = useQueue();
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
            <div className="flex space-x-3 overflow-x-auto pb-2">
              {queue.map((song, index) => (
                <div
                  key={song.id}
                  className="flex flex-col items-center space-y-2 min-w-0 flex-shrink-0"
                >
                  <div className="relative">
                    <Avatar className="w-12 h-12" variant="pixel">
                      <AvatarImage
                        src={
                          song.thumbnail ||
                          `https://i.pravatar.cc/150?u=${song.id}`
                        }
                        alt={song.artist}
                      />
                      <AvatarFallback>{song.artist?.[0] || "?"}</AvatarFallback>
                    </Avatar>
                    <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs retro">
                      {index + 1}
                    </div>
                  </div>
                  <div className="text-center">
                    <p
                      className="text-xs retro truncate w-16"
                      title={song.title}
                    >
                      {song.title}
                    </p>
                    <p
                      className="text-xs text-muted-foreground retro truncate w-16"
                      title={song.artist}
                    >
                      {song.artist}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
