"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import ChatBox from "@/components/ChatBox";
import Queue from "@/components/Queue";
import MusicPlayer from "@/components/MusicPlayer";
import Visualization from "@/components/Visualization";
import { SocketProvider, useSocket } from "@/contexts/SocketContext";
import { QueueProvider } from "@/contexts/QueueContext";
import { AudioContextProvider } from "@/contexts/AudioContextProvider";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/8bit/card";
import { Button } from "@/components/ui/8bit/button";

// Inner component that has access to socket context
function RadioPageContent() {
  const { authenticateUser, isConnected } = useSocket();
  const router = useRouter();
  const [hasEntered, setHasEntered] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    // Check if user is properly registered
    const userId = localStorage.getItem("userId");
    const storedUserName = localStorage.getItem("userName");
    const userAvatar = localStorage.getItem("userAvatar");

    if (!userId || !storedUserName || !userAvatar) {
      // Redirect back to home if user data is missing
      alert("Please register first to access the radio.");
      router.push("/");
      return;
    }

    setUserName(storedUserName);

    // Authenticate user when socket connects
    if (isConnected && userId) {
      console.log("🔐 Authenticating user with ID:", userId);
      authenticateUser(userId);
    }
  }, [isConnected, authenticateUser, router]);

  const handleEnterRadio = async () => {
    // This click enables audio (browser requirement)
    if (audioRef.current) {
      try {
        audioRef.current.src = `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000"}/api/radio/stream?ngrok-skip-browser-warning=true`;
        audioRef.current.load();
        await audioRef.current.play();
        console.log('🔊 Audio enabled on entry');
      } catch (error) {
        console.log('⚠️ Could not auto-play, will retry when song plays');
      }
    }
    setHasEntered(true);
  };

  // Show welcome screen until user clicks to enter
  if (!hasEntered) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="text-2xl">Just click yes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-muted-foreground retro">
              For some reason chrome wants me to have this to be able to listen
            </p>
            
            <Button
              onClick={handleEnterRadio}
              size="lg"
              className="w-full text-lg py-6"
            >
              Yes
            </Button>
            {/* Hidden audio element to enable on click */}
            <audio ref={audioRef} preload="none" />
          </CardContent>
        </Card>
      </div>
    );
  }

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
          <MusicPlayer audioAlreadyEnabled={true} />
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
        <AudioContextProvider>
          <RadioPageContent />
        </AudioContextProvider>
      </QueueProvider>
    </SocketProvider>
  );
}
