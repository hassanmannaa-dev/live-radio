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

interface Song {
  id: number;
  title: string;
  artist: string;
  avatar: string;
}

interface QueueProps {
  songs: Song[];
  className?: string;
}

export default function Queue({ songs, className }: QueueProps) {
  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Up Next</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-3 overflow-x-auto pb-2">
            {songs.map((song, index) => (
              <div
                key={song.id}
                className="flex flex-col items-center space-y-2 min-w-0 flex-shrink-0"
              >
                <div className="relative">
                  <Avatar className="w-12 h-12" variant="pixel">
                    <AvatarImage src={song.avatar} alt={song.artist} />
                    <AvatarFallback>{song.artist[0]}</AvatarFallback>
                  </Avatar>
                  <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs retro">
                    {index + 1}
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-xs retro truncate w-16" title={song.title}>
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
        </CardContent>
      </Card>
    </div>
  );
}
