"use client";

import { useState } from "react";
import ChatBox from "@/components/ChatBox";
import Queue from "@/components/Queue";
import MusicPlayer from "@/components/MusicPlayer";
import Visualization from "@/components/Visualization";

// Mock data for demonstration
const upcomingSongs = [
  {
    id: 1,
    title: "Neon Dreams",
    artist: "SynthWave",
    avatar: "https://i.pravatar.cc/150?img=11",
  },
  {
    id: 2,
    title: "Pixel Paradise",
    artist: "8BitBeats",
    avatar: "https://i.pravatar.cc/150?img=12",
  },
  {
    id: 3,
    title: "Digital Sunset",
    artist: "RetroVibes",
    avatar: "https://i.pravatar.cc/150?img=13",
  },
  {
    id: 4,
    title: "Cyber City",
    artist: "ChipTune",
    avatar: "https://i.pravatar.cc/150?img=14",
  },
  {
    id: 5,
    title: "Electric Love",
    artist: "WaveForm",
    avatar: "https://i.pravatar.cc/150?img=15",
  },
];

export default function RadioPage() {
  const [currentSong] = useState({
    title: "Retro Wave Runner",
    artist: "NeonBeats",
    duration: "3:42",
    currentTime: "1:23",
  });

  return (
    <div className="min-h-screen bg-background p-4 flex items-center justify-center">
      <div className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-3 gap-6 lg:items-stretch">
        {/* Left Section - Main Player */}
        <div className="lg:col-span-2 flex flex-col space-y-4">
          {/* Queue Component */}
          <Queue songs={upcomingSongs} />

          {/* Visualization Component */}
          <Visualization />

          {/* Music Player Component */}
          <MusicPlayer currentSong={currentSong} />
        </div>

        {/* Right Section - Chat Box Component */}
        <div className="flex flex-col">
          <ChatBox className="flex flex-col flex-1" />
        </div>
      </div>
    </div>
  );
}
