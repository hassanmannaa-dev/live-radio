"use client";

import { useState, useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/8bit/card";
import { Progress } from "@/components/ui/8bit/progress";
import { useSocket } from "@/contexts/SocketContext";
import { useQueue } from "@/contexts/QueueContext";

interface MusicPlayerProps {
  className?: string;
}

export default function MusicPlayer({ className }: MusicPlayerProps) {
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [serverTimeOffset, setServerTimeOffset] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<any>(null);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { socket } = useSocket();
  const { currentSong } = useQueue();

  // Calculate synchronized time
  const getSyncedTime = () => {
    return Date.now() + serverTimeOffset;
  };

  // Format time in mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Enable audio with user interaction
  const enableAudio = async () => {
    if (audioRef.current && !audioEnabled) {
      try {
        // Attempt to play and immediately pause to enable audio context
        audioRef.current.volume = 0.001; // Very low volume
        await audioRef.current.play();
        audioRef.current.pause();
        audioRef.current.volume = 1; // Restore volume
        setAudioEnabled(true);
        console.log('🔊 Audio enabled by user interaction');
      } catch (error) {
        console.log('❌ Failed to enable audio:', error);
      }
    }
  };

  // Safe play function that handles autoplay restrictions
  const safePlay = async (audio: HTMLAudioElement) => {
    try {
      await audio.play();
      console.log('🎵 Audio playing successfully');
    } catch (error) {
      console.log('❌ Autoplay prevented:', error);
      setAudioEnabled(false); // Reset audio enabled state
    }
  };

  // Handle socket events for music playback
  useEffect(() => {
    if (!socket) return;

    const handleTimesync = (data: { serverEpochMs: number }) => {
      const clientTime = Date.now();
      const offset = data.serverEpochMs - clientTime;
      setServerTimeOffset(offset);
    };

    const handlePrepare = (data: any) => {
      console.log('🎵 Preparing track:', data);
      setCurrentTrack(data);
      setIsPlaying(false);

      if (audioRef.current) {
        audioRef.current.src = data.fileUrl;
        audioRef.current.load();
      }
    };

    const handleStart = async (data: { id: string; startEpochMs: number }) => {
      console.log('🎵 Starting playback:', data);
      if (currentTrack && currentTrack.id === data.id) {
        setIsPlaying(true);

        // Calculate how much time has passed since the start time
        const now = getSyncedTime();
        const elapsedMs = now - data.startEpochMs;
        const elapsedSeconds = elapsedMs / 1000;

        if (audioRef.current) {
          // Seek to the correct position (handles mid-song joins)
          audioRef.current.currentTime = Math.max(0, elapsedSeconds);
          await safePlay(audioRef.current);
        }
      }
    };

    const handleEnded = (data: { id: string }) => {
      console.log('🎵 Track ended:', data);
      setIsPlaying(false);
      setCurrentTrack(null);
      setProgress(0);
      setCurrentTime(0);

      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };

    const handleNowPlayingForAudio = (data: any) => {
      console.log('🎵 Now playing state (audio sync):', data);

      if (data.nowPlaying) {
        // Set current track for audio playback
        setCurrentTrack(data.nowPlaying);

        // If song is currently playing, start it immediately with sync
        if (data.phase === 'playing' && data.nowPlaying.startEpochMs) {
          setIsPlaying(true);

          if (audioRef.current && data.nowPlaying.fileUrl) {
            audioRef.current.src = data.nowPlaying.fileUrl;
            audioRef.current.load();

            // Wait for audio to load then sync
            audioRef.current.addEventListener('loadedmetadata', async () => {
              const now = getSyncedTime();
              const elapsedMs = now - data.nowPlaying.startEpochMs;
              const elapsedSeconds = elapsedMs / 1000;

              if (audioRef.current && elapsedSeconds >= 0 && elapsedSeconds < audioRef.current.duration) {
                audioRef.current.currentTime = elapsedSeconds;
                await safePlay(audioRef.current);
                console.log(`🎵 Synced to ${elapsedSeconds.toFixed(1)}s into the song`);
              }
            }, { once: true });
          }
        }
        // If song is prepared but not yet playing, just load it
        else if (data.phase === 'prepared' && data.nowPlaying.fileUrl) {
          setIsPlaying(false);
          if (audioRef.current) {
            audioRef.current.src = data.nowPlaying.fileUrl;
            audioRef.current.load();
          }
        }
      } else {
        setCurrentTrack(null);
        setIsPlaying(false);
        setProgress(0);
        setCurrentTime(0);
      }
    };

    socket.on('timesync', handleTimesync);
    socket.on('prepare', handlePrepare);
    socket.on('start', handleStart);
    socket.on('ended', handleEnded);
    socket.on('nowPlaying', handleNowPlayingForAudio);

    return () => {
      socket.off('timesync', handleTimesync);
      socket.off('prepare', handlePrepare);
      socket.off('start', handleStart);
      socket.off('ended', handleEnded);
      socket.off('nowPlaying', handleNowPlayingForAudio);
    };
  }, [socket, currentTrack, serverTimeOffset]);

  // Update progress and current time
  useEffect(() => {
    if (!isPlaying || !currentTrack) return;

    const interval = setInterval(() => {
      if (audioRef.current && !audioRef.current.paused) {
        const current = audioRef.current.currentTime;
        const duration = audioRef.current.duration || currentTrack.durationSec || 1;

        setCurrentTime(current);
        setProgress((current / duration) * 100);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, currentTrack]);

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Now Playing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Hidden audio element for playback */}
          <audio
            ref={audioRef}
            preload="metadata"
            onLoadedMetadata={() => {
              console.log('Audio metadata loaded');
            }}
            onError={(e) => {
              console.error('Audio error:', e);
            }}
          />

          <div className="text-center">
            {currentTrack ? (
              <>
                <h3 className="text-lg retro">{currentTrack.title || 'Loading...'}</h3>
                <p className="text-muted-foreground retro">
                  {currentSong?.artist || 'Unknown Artist'}
                </p>
              </>
            ) : (
              <>
                <h3 className="text-lg retro">No song playing</h3>
                <p className="text-muted-foreground retro">Queue a song to start listening</p>
              </>
            )}
          </div>

          <div className="space-y-2">
            <Progress
              value={progress}
              variant="retro"
              className="h-6"
              progressBg={isPlaying ? "bg-green-500" : "bg-gray-500"}
            />
            <div className="flex justify-between text-sm retro text-muted-foreground">
              <span>{formatTime(currentTime)}</span>
              <span>
                {currentTrack?.durationSec ? formatTime(currentTrack.durationSec) : '0:00'}
              </span>
            </div>
          </div>

          {/* Audio Enable Button */}
          {!audioEnabled && currentTrack && (
            <div className="text-center space-y-2">
              <button
                onClick={enableAudio}
                className="px-4 py-2 bg-green-600 text-white rounded retro hover:bg-green-700 transition-colors"
              >
                🔊 Click to Enable Audio
              </button>
              <p className="text-xs text-muted-foreground retro">
                Browser requires user interaction to play audio
              </p>
            </div>
          )}

          {/* Playbook status */}
          <div className="text-center">
            <span className={`text-xs retro ${
              isPlaying ? 'text-green-500' : 'text-muted-foreground'
            }`}>
              {!audioEnabled && currentTrack ? '🔇 Audio Disabled' :
               isPlaying ? '▶️ Playing' :
               currentTrack ? '⏸️ Prepared' : '⏹️ Idle'}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
