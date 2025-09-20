"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/8bit/card";
import { Input } from "@/components/ui/8bit/input";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@/components/ui/8bit/avatar";
import { Button } from "@/components/ui/8bit/button";

// Fake avatar images for demo
const avatarOptions = [
  { id: 1, src: "https://i.pravatar.cc/150?img=1", alt: "Avatar 1" },
  { id: 2, src: "https://i.pravatar.cc/150?img=2", alt: "Avatar 2" },
  { id: 3, src: "https://i.pravatar.cc/150?img=3", alt: "Avatar 3" },
  { id: 4, src: "https://i.pravatar.cc/150?img=4", alt: "Avatar 4" },
];

export default function Home() {
  const [name, setName] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleContinue = async () => {
    if (!name.trim() || selectedAvatar === null) {
      alert("Please enter your name and select an avatar");
      return;
    }

    setIsLoading(true);

    try {
      // Call API endpoint
      const response = await fetch("/api/user-setup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          avatarId: selectedAvatar,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("User setup successful:", data);
        // Handle success (e.g., redirect or show success message)
      } else {
        console.error("Failed to setup user");
        alert("Failed to setup user. Please try again.");
      }
    } catch (error) {
      console.error("Error calling API:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl">
            Welcome to Live Radio
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Name Input */}
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium retro">
              Enter your name:
            </label>
            <Input
              id="name"
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Avatar Selection */}
          <div className="space-y-4">
            <label className="text-sm font-medium retro">
              Choose your avatar:
            </label>
            <div className="grid grid-cols-4 gap-4 justify-items-center">
              {avatarOptions.map((avatar) => (
                <button
                  key={avatar.id}
                  onClick={() => setSelectedAvatar(avatar.id)}
                  className={`relative transition-all duration-200 ${
                    selectedAvatar === avatar.id
                      ? "scale-110 ring-4 ring-primary ring-offset-2 ring-offset-background"
                      : "hover:scale-105"
                  }`}
                >
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={avatar.src} alt={avatar.alt} />
                    <AvatarFallback className="retro">
                      {avatar.id}
                    </AvatarFallback>
                  </Avatar>
                  {selectedAvatar === avatar.id && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                      <span className="text-xs text-primary-foreground">✓</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Continue Button */}
          <Button
            onClick={handleContinue}
            disabled={!name.trim() || selectedAvatar === null || isLoading}
            className="w-full"
            size="lg"
          >
            {isLoading ? "Setting up..." : "Continue"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
