"use client";

import { useEffect, useRef, useState } from "react";
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
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const [audioLoading, setAudioLoading] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [volume, setVolume] = useState(0.7);

  // Stream URL from backend
  const streamUrl = "http://localhost:5000/api/radio/stream";

  // Handle audio streaming
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying && currentSong) {
      // Start playing the stream
      setAudioLoading(true);
      setAudioError(null);
      
      // Always refresh the stream URL to ensure fresh connection
      const timestampedUrl = `${streamUrl}?t=${Date.now()}`;
      audio.src = timestampedUrl;
      
      audio.play()
        .then(() => {
          setAudioLoading(false);
          console.log("🔊 Audio stream started successfully");
        })
        .catch((error) => {
          console.error("Audio playback error:", error);
          setAudioError("Failed to start audio playback");
          setAudioLoading(false);
          
          // Try to reconnect after a delay if there's still a song playing
          setTimeout(() => {
            if (isPlaying && currentSong && audioRef.current) {
              console.log("🔄 Attempting to reconnect audio stream...");
              const retryUrl = `${streamUrl}?retry=${Date.now()}`;
              audioRef.current.src = retryUrl;
              audioRef.current.play().catch(retryError => {
                console.error("Retry failed:", retryError);
              });
            }
          }, 2000);
        });
    } else {
      // Pause the stream
      audio.pause();
      setAudioLoading(false);
    }
  }, [isPlaying, currentSong, streamUrl]);

  // Handle volume changes
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = volume;
    }
  }, [volume]);

  // Audio event handlers
  const handleAudioError = (e: any) => {
    console.error("Audio error:", e);
    setAudioError("Audio stream error");
    setAudioLoading(false);
  };

  const handleAudioLoadStart = () => {
    setAudioLoading(true);
    setAudioError(null);
  };

  const handleAudioCanPlay = () => {
    setAudioLoading(false);
    console.log("🔊 Audio ready to play");
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(parseFloat(e.target.value));
  };

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">
            Now Playing
            {isPlaying && (
              <span className="text-xs text-green-500 ml-2">
                {audioLoading ? "(Loading...)" : "(Live)"}
              </span>
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

              {/* Volume Control */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="text-sm retro">🔊</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={volume}
                    onChange={handleVolumeChange}
                    className="flex-1 h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-sm retro text-muted-foreground">
                    {Math.round(volume * 100)}%
                  </span>
                </div>
              </div>

              {/* Audio Error Display */}
              {audioError && (
                <div className="text-center py-2">
                  <div className="text-red-500 text-sm retro">
                    ⚠️ {audioError}
                  </div>
                  <div className="text-xs text-muted-foreground retro mt-1">
                    Try refreshing the page or check your connection
                  </div>
                </div>
              )}
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

          {/* Hidden Audio Element for Streaming */}
          <audio
            ref={audioRef}
            preload="none"
            onError={handleAudioError}
            onLoadStart={handleAudioLoadStart}
            onCanPlay={handleAudioCanPlay}
            style={{ display: 'none' }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
