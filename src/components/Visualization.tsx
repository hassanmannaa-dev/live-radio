"use client";

import { useState } from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/8bit/card";

const randomGifs = [
  "https://media.giphy.com/media/3o7TKAXkWwJBawSsfu/giphy.gif",
  "https://media.giphy.com/media/l0HlvyZMx9K4u5WuY/giphy.gif",
  "https://media.giphy.com/media/26tn33aiTi1jkl6H6/giphy.gif",
  "https://media.giphy.com/media/3oKIPEAVLNcZCNOpLa/giphy.gif",
  "https://media.giphy.com/media/l41lPTfaKeKbwBllm/giphy.gif",
];

interface VisualizationProps {
  className?: string;
  customGif?: string;
}

export default function Visualization({
  className,
  customGif,
}: VisualizationProps) {
  const [randomGif] = useState(
    () => customGif || randomGifs[Math.floor(Math.random() * randomGifs.length)]
  );

  return (
    <div className={className}>
      <Card>
        <CardContent className="flex items-center justify-center">
          <div className="w-full h-64 bg-muted rounded-lg overflow-hidden flex items-center justify-center border-4 border-foreground">
            <Image
              src={randomGif}
              alt="Music Visualization"
              width={500}
              height={500}
              className="w-full h-full object-cover"
              style={{ imageRendering: "pixelated" }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
