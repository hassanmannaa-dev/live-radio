"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ChatBox from "@/components/ChatBox";
import Queue from "@/components/Queue";
import MusicPlayer from "@/components/MusicPlayer";
import Visualization from "@/components/Visualization";
import { SocketProvider, useSocket } from "@/contexts/SocketContext";
import { QueueProvider } from "@/contexts/QueueContext";

// Inner component that has access to socket context
function RadioPageContent() {
  const { authenticateUser, isConnected } = useSocket();
  const router = useRouter();

  useEffect(() => {
    // Check if user is properly registered
    const userId = localStorage.getItem("userId");
    const userName = localStorage.getItem("userName");
    const userAvatar = localStorage.getItem("userAvatar");

    if (!userId || !userName || !userAvatar) {
      // Redirect back to home if user data is missing
      alert("Please register first to access the radio.");
      router.push("/");
      return;
    }

    // Authenticate user when socket connects
    if (isConnected && userId) {
      console.log("🔐 Authenticating user with ID:", userId);
      authenticateUser(userId);
    }
  }, [isConnected, authenticateUser, router]);

  return (
    <div className="min-h-screen bg-background p-4 flex items-center justify-center">
      <div className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-3 gap-6 lg:items-stretch">
        {/* Left Section - Main Player */}
        <div className="lg:col-span-2 flex flex-col space-y-4">
          {/* Queue Component */}
          <Queue />

          {/* Visualization Component */}
          <Visualization />

          {/* Music Player Component */}
          <MusicPlayer />
        </div>

        {/* Right Section - Chat Box Component */}
        <div className="flex flex-col">
          <ChatBox className="flex flex-col flex-1" />
        </div>
      </div>
    </div>
  );
}

// Main component wrapped with providers
export default function RadioPage() {
  return (
    <SocketProvider>
      <QueueProvider>
        <RadioPageContent />
      </QueueProvider>
    </SocketProvider>
  );
}
