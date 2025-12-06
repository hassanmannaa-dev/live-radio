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

interface Song {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration: number;
  thumbnail?: string;
  url?: string;
}

interface RadioState {
  currentSong: Song | null;
  isPlaying: boolean;
  startTime: number;
  position: number;
  listenerCount: number;
}

interface MusicPlayerProps {
  className?: string;
}

export default function MusicPlayer({ className }: MusicPlayerProps) {
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<Song | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [listenerCount, setListenerCount] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { socket, isAuthenticated } = useSocket();

  // Fetch initial radio status via HTTP
  const fetchRadioStatus = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/radio/status");
      if (response.ok) {
        const data: RadioState = await response.json();
        console.log('📻 Initial radio status:', data);
        setCurrentTrack(data.currentSong);
        setIsPlaying(data.isPlaying);
        setCurrentTime(data.position);
        setListenerCount(data.listenerCount);
        if (data.currentSong && data.isPlaying) {
          setProgress((data.position / data.currentSong.duration) * 100);
        }
      }
    } catch (error) {
      console.error('Failed to fetch radio status:', error);
    }
  };

  // Format time in mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Enable audio with user interaction
  const enableAudio = async () => {
    console.log('🔊 enableAudio called', {
      hasAudioRef: !!audioRef.current,
      audioEnabled,
      isPlaying
    });

    if (!audioEnabled && isPlaying && audioRef.current) {
      try {
        console.log('🔊 Setting audio source...');
        audioRef.current.src = "http://localhost:5000/api/radio/stream";
        audioRef.current.load();
        console.log('🔊 Calling play...');
        await audioRef.current.play();
        setAudioEnabled(true);
        console.log('🔊 Audio enabled and streaming');
      } catch (error) {
        console.log('❌ Failed to enable audio:', error);
        // Reset audio state on error
        if (audioRef.current) {
          audioRef.current.src = "";
        }
      }
    } else {
      console.log('🔊 Skipped - conditions not met');
    }
  };

  // Stop audio when nothing is playing
  useEffect(() => {
    if (!isPlaying && audioRef.current && audioEnabled) {
      audioRef.current.pause();
      audioRef.current.src = "";
      setAudioEnabled(false);
      console.log('🔇 Audio stopped - nothing playing');
    }
  }, [isPlaying, audioEnabled]);

  // Handle socket events for radio state
  useEffect(() => {
    if (!socket) return;

    const handleRadioUpdate = (data: RadioState) => {
      console.log('📻 Radio update:', data);
      setCurrentTrack(data.currentSong);
      setIsPlaying(data.isPlaying);
      setCurrentTime(data.position);
      setListenerCount(data.listenerCount);

      if (data.currentSong && data.isPlaying) {
        setProgress((data.position / data.currentSong.duration) * 100);
      } else {
        setProgress(0);
      }

      // If nothing is playing, stop the audio
      if (!data.currentSong || !data.isPlaying) {
        if (audioRef.current && audioEnabled) {
          audioRef.current.pause();
        }
      }
    };

    const handleListenerUpdate = (data: { count: number }) => {
      console.log('👥 Listener count:', data.count);
      setListenerCount(data.count);
    };

    socket.on('radioUpdate', handleRadioUpdate);
    socket.on('listenerUpdate', handleListenerUpdate);

    // Request initial radio state after authentication
    if (isAuthenticated) {
      socket.emit('requestRadioState');
      fetchRadioStatus(); // Also fetch via HTTP as fallback
    }

    return () => {
      socket.off('radioUpdate', handleRadioUpdate);
      socket.off('listenerUpdate', handleListenerUpdate);
    };
  }, [socket, isAuthenticated, audioEnabled]);

  // Update progress and current time
  useEffect(() => {
    if (!isPlaying || !currentTrack) return;

    const interval = setInterval(() => {
      if (audioRef.current && !audioRef.current.paused) {
        const current = audioRef.current.currentTime;
        const duration = audioRef.current.duration || currentTrack.duration || 1;

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
            preload="none"
            crossOrigin="anonymous"
            onLoadedMetadata={() => {
              console.log('Audio metadata loaded');
            }}
            onError={(e) => {
              // Only log error if we actually have a source set
              if (audioRef.current?.src && audioRef.current.src !== window.location.href) {
                console.error('Audio error:', e);
                setAudioEnabled(false);
              }
            }}
          />

          <div className="text-center">
            {currentTrack ? (
              <>
                <h3 className="text-lg retro">{currentTrack.title || 'Loading...'}</h3>
                <p className="text-muted-foreground retro">
                  {currentTrack?.artist || 'Unknown Artist'}
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
                {currentTrack?.duration ? formatTime(currentTrack.duration) : '0:00'}
              </span>
            </div>
          </div>

          {/* Audio Enable Button */}
          {!audioEnabled && isPlaying && currentTrack && (
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

          {/* Playback status */}
          <div className="text-center space-y-1">
            <span className={`text-xs retro ${
              isPlaying ? 'text-green-500' : 'text-muted-foreground'
            }`}>
              {!audioEnabled && currentTrack ? '🔇 Audio Disabled' :
               isPlaying ? '▶️ Playing' :
               currentTrack ? '⏸️ Prepared' : '⏹️ Idle'}
            </span>
            <div className="text-xs text-muted-foreground retro">
              👥 {listenerCount} {listenerCount === 1 ? 'listener' : 'listeners'}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
