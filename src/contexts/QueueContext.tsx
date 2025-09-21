"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useSocket } from "@/contexts/SocketContext";

interface QueueSong {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration?: number;
  thumbnail?: string;
  url?: string;
}

interface QueueContextType {
  queue: QueueSong[];
  currentSong: QueueSong | null;
  isLoading: boolean;
  fetchQueue: () => Promise<void>;
  addToQueue: (songId: string) => Promise<boolean>;
  isInQueue: (songId: string) => boolean;
  addingToQueue: Set<string>;
}

const QueueContext = createContext<QueueContextType | undefined>(undefined);

export const useQueue = () => {
  const context = useContext(QueueContext);
  if (context === undefined) {
    throw new Error("useQueue must be used within a QueueProvider");
  }
  return context;
};

interface QueueProviderProps {
  children: React.ReactNode;
}

export const QueueProvider: React.FC<QueueProviderProps> = ({ children }) => {
  const [queue, setQueue] = useState<QueueSong[]>([]);
  const [currentSong, setCurrentSong] = useState<QueueSong | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [addingToQueue, setAddingToQueue] = useState<Set<string>>(new Set());
  const { socket, isConnected } = useSocket();

  // Fetch queue from backend
  const fetchQueue = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("http://localhost:5000/api/queue");

      if (!response.ok) {
        throw new Error("Failed to fetch queue");
      }

      const data = await response.json();
      setQueue(data.playlist || []);
      setCurrentSong(data.currentSong || null);
    } catch (error) {
      console.error("Error fetching queue:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Add song to queue with duplicate prevention
  const addToQueue = async (songId: string): Promise<boolean> => {
    // Check if already in queue or currently being added
    if (isInQueue(songId) || addingToQueue.has(songId)) {
      console.log("Song already in queue or being added:", songId);
      return false;
    }

    try {
      // Mark as being added to prevent duplicates
      setAddingToQueue((prev) => new Set(prev).add(songId));

      const response = await fetch("http://localhost:5000/api/queue", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: songId }),
      });

      if (!response.ok) {
        throw new Error("Failed to add song to queue");
      }

      const data = await response.json();
      console.log("Song added to queue:", data);

      // Queue will be updated via socket event automatically
      // No need for optimistic update since socket events are reliable

      return true;
    } catch (error) {
      console.error("Add to queue error:", error);
      return false;
    } finally {
      // Remove from adding set after a delay to prevent rapid clicking
      setTimeout(() => {
        setAddingToQueue((prev) => {
          const newSet = new Set(prev);
          newSet.delete(songId);
          return newSet;
        });
      }, 1000);
    }
  };

  // Check if song is already in queue
  const isInQueue = (songId: string): boolean => {
    return (
      queue.some((song) => song.id === songId) ||
      currentSong?.id === songId ||
      false
    );
  };

  // Socket event listeners for queue updates
  useEffect(() => {
    if (!socket) return;

    const handlePlaylistUpdate = (playlist: QueueSong[]) => {
      console.log("📋 Playlist updated:", playlist);
      setQueue(playlist);
    };

    const handleCurrentSongUpdate = (song: QueueSong | null) => {
      console.log("🎵 Current song updated:", song);
      setCurrentSong(song);
    };

    socket.on("playlistUpdate", handlePlaylistUpdate);
    socket.on("currentSongUpdate", handleCurrentSongUpdate);

    return () => {
      socket.off("playlistUpdate", handlePlaylistUpdate);
      socket.off("currentSongUpdate", handleCurrentSongUpdate);
    };
  }, [socket]);

  // Fetch initial queue when connected
  useEffect(() => {
    if (isConnected) {
      fetchQueue();
    }
  }, [isConnected]);

  const value: QueueContextType = {
    queue,
    currentSong,
    isLoading,
    fetchQueue,
    addToQueue,
    isInQueue,
    addingToQueue,
  };

  return (
    <QueueContext.Provider value={value}>{children}</QueueContext.Provider>
  );
};
