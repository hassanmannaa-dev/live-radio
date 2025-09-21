"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useSocket } from "@/contexts/SocketContext";

interface CurrentSong {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration?: number;
  thumbnail?: string;
  url?: string;
}

interface ProgressData {
  currentPosition: number;
  duration: number;
  progress: number;
  formattedCurrentTime: string;
  formattedDuration: string;
  isPlaying: boolean;
  currentSong: CurrentSong | null;
}

interface MusicPlayerContextType {
  currentSong: CurrentSong | null;
  isPlaying: boolean;
  progress: number;
  currentPosition: number;
  duration: number;
  formattedCurrentTime: string;
  formattedDuration: string;
  isLoading: boolean;
  requestCurrentSong: () => void;
  requestProgress: () => void;
}

const MusicPlayerContext = createContext<MusicPlayerContextType | undefined>(undefined);

export const useMusicPlayer = () => {
  const context = useContext(MusicPlayerContext);
  if (context === undefined) {
    throw new Error("useMusicPlayer must be used within a MusicPlayerProvider");
  }
  return context;
};

interface MusicPlayerProviderProps {
  children: React.ReactNode;
}

export const MusicPlayerProvider: React.FC<MusicPlayerProviderProps> = ({ children }) => {
  const [currentSong, setCurrentSong] = useState<CurrentSong | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [formattedCurrentTime, setFormattedCurrentTime] = useState("0:00");
  const [formattedDuration, setFormattedDuration] = useState("0:00");
  const [isLoading, setIsLoading] = useState(false);
  const { socket, isConnected } = useSocket();

  // Request current song from server
  const requestCurrentSong = () => {
    if (socket && isConnected) {
      console.log("🎵 Requesting current song from server");
      socket.emit("requestCurrentSong");
    }
  };

  // Request current progress from server
  const requestProgress = () => {
    if (socket && isConnected) {
      console.log("⏱️ Requesting progress from server");
      socket.emit("requestProgress");
    }
  };

  // Socket event listeners for music player updates
  useEffect(() => {
    if (!socket) return;

    // Handle current song updates
    const handleCurrentSongUpdate = (song: CurrentSong | null) => {
      console.log("🎵 Current song updated:", song);
      setCurrentSong(song);
      
      if (!song) {
        // Reset player state when no song is playing
        setIsPlaying(false);
        setProgress(0);
        setCurrentPosition(0);
        setDuration(0);
        setFormattedCurrentTime("0:00");
        setFormattedDuration("0:00");
      }
    };

    // Handle progress updates
    const handleProgressUpdate = (progressData: ProgressData) => {
      console.log("⏱️ Progress updated:", progressData);
      
      if (progressData.currentSong) {
        setCurrentSong(progressData.currentSong);
      }
      
      setIsPlaying(progressData.isPlaying);
      setProgress(progressData.progress);
      setCurrentPosition(progressData.currentPosition);
      setDuration(progressData.duration);
      setFormattedCurrentTime(progressData.formattedCurrentTime);
      setFormattedDuration(progressData.formattedDuration);
    };

    // Handle radio state updates (for overall sync)
    const handleRadioUpdate = (radioState: any) => {
      console.log("📻 Radio state updated:", radioState);
      
      if (radioState.currentSong) {
        setCurrentSong(radioState.currentSong);
        setIsPlaying(radioState.isPlaying);
        setProgress(radioState.progress || 0);
        setCurrentPosition(radioState.currentPosition || 0);
        setDuration(radioState.currentSong.duration || 0);
        setFormattedCurrentTime(radioState.formattedCurrentTime || "0:00");
        setFormattedDuration(radioState.formattedDuration || "0:00");
      } else {
        // No song playing
        setCurrentSong(null);
        setIsPlaying(false);
        setProgress(0);
        setCurrentPosition(0);
        setDuration(0);
        setFormattedCurrentTime("0:00");
        setFormattedDuration("0:00");
      }
    };

    socket.on("currentSongUpdate", handleCurrentSongUpdate);
    socket.on("progressUpdate", handleProgressUpdate);
    socket.on("radioUpdate", handleRadioUpdate);

    return () => {
      socket.off("currentSongUpdate", handleCurrentSongUpdate);
      socket.off("progressUpdate", handleProgressUpdate);
      socket.off("radioUpdate", handleRadioUpdate);
    };
  }, [socket]);

  // Request initial state when connected
  useEffect(() => {
    if (isConnected && socket) {
      console.log("🔌 Connected to server, requesting initial music player state");
      requestCurrentSong();
      requestProgress();
      // Also request radio state for full sync
      socket.emit("requestRadioState");
    }
  }, [isConnected, socket]);

  const value: MusicPlayerContextType = {
    currentSong,
    isPlaying,
    progress,
    currentPosition,
    duration,
    formattedCurrentTime,
    formattedDuration,
    isLoading,
    requestCurrentSong,
    requestProgress,
  };

  return (
    <MusicPlayerContext.Provider value={value}>
      {children}
    </MusicPlayerContext.Provider>
  );
}; 