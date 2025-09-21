"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/8bit/card";
import { Progress } from "@/components/ui/8bit/progress";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";

interface MusicPlayerProps {
  className?: string;
}

export default function MusicPlayer({
  className,
}: MusicPlayerProps) {
  const {
    currentSong,
    isPlaying,
    progress,
    formattedCurrentTime,
    formattedDuration,
  } = useMusicPlayer();

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">
            Now Playing
            {isPlaying && (
              <span className="text-xs text-green-500 ml-2">(Live)</span>
            )}
            {!isPlaying && currentSong && (
              <span className="text-xs text-muted-foreground ml-2">(Paused)</span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentSong ? (
            <>
              <div className="text-center">
                <h3 className="text-lg retro">{currentSong.title}</h3>
                <p className="text-muted-foreground retro">{currentSong.artist}</p>
                {currentSong.album && (
                  <p className="text-sm text-muted-foreground retro">
                    from {currentSong.album}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Progress
                  value={progress}
                  variant="retro"
                  className="h-6"
                  progressBg="bg-green-500"
                />
                <div className="flex justify-between text-sm retro text-muted-foreground">
                  <span>{formattedCurrentTime}</span>
                  <span>{formattedDuration}</span>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <div className="text-muted-foreground retro">
                No song currently playing
              </div>
              <div className="text-xs text-muted-foreground retro mt-2">
                Add songs to the queue to start listening!
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
