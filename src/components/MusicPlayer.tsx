"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/8bit/card";
import { Progress } from "@/components/ui/8bit/progress";

interface CurrentSong {
  title: string;
  artist: string;
  duration: string;
  currentTime: string;
}

interface MusicPlayerProps {
  currentSong: CurrentSong;
  className?: string;
}

export default function MusicPlayer({
  currentSong,
  className,
}: MusicPlayerProps) {
  const [progress, setProgress] = useState(0);

  // Simulate progress bar movement
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + 0.5;
        return newProgress >= 100 ? 0 : newProgress;
      });
    }, 200);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Now Playing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <h3 className="text-lg retro">{currentSong.title}</h3>
            <p className="text-muted-foreground retro">{currentSong.artist}</p>
          </div>

          <div className="space-y-2">
            <Progress
              value={progress}
              variant="retro"
              className="h-6"
              progressBg="bg-green-500"
            />
            <div className="flex justify-between text-sm retro text-muted-foreground">
              <span>{currentSong.currentTime}</span>
              <span>{currentSong.duration}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
