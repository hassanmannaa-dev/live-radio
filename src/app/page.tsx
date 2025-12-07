"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/8bit/card";
import { Input } from "@/components/ui/8bit/input";
import { Button } from "@/components/ui/8bit/button";

// Profile image options - add images to public/profiles/ folder named 1.png, 2.png, etc.
const PROFILE_COUNT = 5; // Update this when you add more profile images

const avatarOptions = Array.from({ length: PROFILE_COUNT }, (_, index) => ({
  id: index + 1,
  src: `/profiles/${index + 1}.png`,
  alt: `Profile ${index + 1}`,
}));

export default function Home() {
  const [name, setName] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleContinue = async () => {
    if (!name.trim() || selectedAvatar === null) {
      alert("Please enter your username and select an avatar");
      return;
    }

    // Validate username format (same as backend)
    if (name.length < 2 || name.length > 20) {
      alert("Username must be between 2 and 20 characters");
      return;
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
      alert("Username can only contain letters, numbers, underscore, or dash");
      return;
    }

    setIsLoading(true);

    try {
      // Call backend API endpoint for user registration
      const response = await fetch("http://localhost:5000/api/user/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          avatarId: selectedAvatar,
        }),
      });

      const data = await response.json();

      if (response.ok && data.user) {
        console.log("User registration successful:", data);
        // Store user info in localStorage for later use
        localStorage.setItem("userId", data.user.id);
        localStorage.setItem("userName", data.user.name || name.trim());
        localStorage.setItem("userAvatar", String(data.user.avatarId || selectedAvatar));
        localStorage.setItem("user", JSON.stringify(data.user));
        // Redirect to radio page
        router.push("/radio");
      } else {
        console.error("Failed to register user:", data.error);
        const errorMessage = typeof data.error === 'string' ? data.error : "Failed to register user. Please try again.";
        alert(errorMessage);
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
              Enter your username:
            </label>
            <Input
              id="name"
              type="text"
              placeholder="Your username"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full"
              maxLength={20}
            />
            <div className="text-xs text-muted-foreground">
              2-20 characters, letters, numbers, underscore, or dash only
            </div>
          </div>

          {/* Avatar Selection */}
          <div className="space-y-4">
            <label className="text-sm font-medium retro">
              Choose your avatar:
            </label>
            <div className="grid grid-cols-5 gap-3 justify-items-center max-h-48 overflow-y-auto scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {avatarOptions.map((avatar) => (
                <button
                  key={avatar.id}
                  onClick={() => setSelectedAvatar(avatar.id)}
                  className={`relative w-14 h-14 border-2 rounded-full flex items-center justify-center transition-all duration-200 overflow-hidden cursor-pointer ${
                    selectedAvatar === avatar.id
                      ? "border-primary bg-primary/10 scale-110"
                      : "border-border hover:border-primary hover:scale-105"
                  }`}
                  title={avatar.alt}
                >
                  <Image
                    src={avatar.src}
                    alt={avatar.alt}
                    width={56}
                    height={56}
                    className="w-full h-full object-cover"
                  />
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
