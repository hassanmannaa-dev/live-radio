"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/8bit/card";
import { Button } from "@/components/ui/8bit/button";
import { useAudioContext } from "@/contexts/AudioContextProvider";
import { ChevronLeft, ChevronRight, Eye, EyeOff } from "lucide-react";

const randomGifs = [
  "https://media1.tenor.com/m/RdYowW9KtNMAAAAC/dancing-happy-dance.gif",
  "https://media1.tenor.com/m/lQ9SU3vt_f4AAAAd/cool-fun.gif",
  "https://media1.tenor.com/m/GM_8ETMrSmAAAAAd/dance-old-man-dancing.gif",
  "https://media1.tenor.com/m/yV0zFCvJkEYAAAAd/speed-boat.gif",
  "https://media1.tenor.com/m/8JhcC4OtwC8AAAAC/hatsune-miku-dance.gif",
  "https://media1.tenor.com/m/Uk3HwkPklK0AAAAd/gangster-dance-with-miku-ganster-dance.gif",
  "https://media.tenor.com/BL038T2Guc4AAAAi/kuromi-dance-melody-dance.gif",
  "https://media.tenor.com/vX-qFMkapQQAAAAi/cat-dancing.gif",
  "https://media.tenor.com/wNA4hiEeUIQAAAAi/cat-meme-cat-dance.gif",
  "https://media1.tenor.com/m/5JtSeb0T71MAAAAC/dancing-banana.gif",
  "https://media.tenor.com/axlcoK34Ur4AAAAi/sonic.gif",
  "https://media1.tenor.com/m/yyofCYnEXksAAAAC/sonic-the-hedgehog-classic-sonic.gif",
  "https://media1.tenor.com/m/9bB21xJ32YMAAAAC/fearless-year-of-shadow-shadow-the-hedgehog.gif",
  "https://media1.tenor.com/m/GCfIfzAoCcEAAAAd/fearless-year-of-shadow-year-of-shadow.gif"
];

type VisualizationMode = "visualizer" | "gif";

interface VisualizationProps {
  className?: string;
  customGif?: string;
}

export default function Visualization({
  className,
  customGif,
}: VisualizationProps) {
  const [mode, setMode] = useState<VisualizationMode>("visualizer");
  const [isEnabled, setIsEnabled] = useState(true);
  const [gifIndex, setGifIndex] = useState(() =>
    customGif ? -1 : Math.floor(Math.random() * randomGifs.length)
  );
  const [isSupported, setIsSupported] = useState<boolean | null>(null);
  const [presetIndex, setPresetIndex] = useState(0);
  const [presetNames, setPresetNames] = useState<string[]>([]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const visualizerRef = useRef<ReturnType<typeof import('butterchurn').default.createVisualizer> | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { audioContext, audioNode } = useAudioContext();

  // Check if butterchurn is supported
  useEffect(() => {
    const checkSupport = async () => {
      try {
        const isSupported = await import('butterchurn/lib/isSupported.min');
        setIsSupported(isSupported.default());
      } catch {
        setIsSupported(false);
      }
    };
    checkSupport();
  }, []);

  // Load presets
  useEffect(() => {
    const loadPresets = async () => {
      try {
        const butterchurnPresets = await import('butterchurn-presets');
        const presets = butterchurnPresets.default.getPresets();
        setPresetNames(Object.keys(presets));
      } catch (error) {
        console.error('Failed to load presets:', error);
      }
    };
    loadPresets();
  }, []);

  // Initialize visualizer
  const initVisualizer = useCallback(async () => {
    if (!canvasRef.current || !audioContext || !isSupported || !containerRef.current) return;

    try {
      const butterchurn = await import('butterchurn');
      const butterchurnPresets = await import('butterchurn-presets');

      const canvas = canvasRef.current;
      const container = containerRef.current;
      const width = container.clientWidth;
      const height = container.clientHeight;

      // Set canvas actual resolution to match display size
      canvas.width = width;
      canvas.height = height;

      // Create visualizer
      const visualizer = butterchurn.default.createVisualizer(audioContext, canvas, {
        width,
        height,
        pixelRatio: 1, // We're already using actual pixel dimensions
      });

      visualizerRef.current = visualizer;

      // Load initial preset
      const presets = butterchurnPresets.default.getPresets();
      const presetKeys = Object.keys(presets);
      if (presetKeys.length > 0) {
        const preset = presets[presetKeys[presetIndex]];
        visualizer.loadPreset(preset, 0.0);
      }

      // Connect audio if available
      if (audioNode) {
        visualizer.connectAudio(audioNode);
      }

      // Set size
      visualizer.setRendererSize(width, height);
    } catch (error) {
      console.error('Failed to initialize butterchurn:', error);
    }
  }, [audioContext, audioNode, isSupported, presetIndex]);

  // Handle resize
  useEffect(() => {
    if (!visualizerRef.current || !containerRef.current || !canvasRef.current) return;

    const handleResize = () => {
      const container = containerRef.current;
      const canvas = canvasRef.current;
      if (!container || !visualizerRef.current || !canvas) return;

      const width = container.clientWidth;
      const height = container.clientHeight;

      // Update canvas resolution
      canvas.width = width;
      canvas.height = height;

      visualizerRef.current.setRendererSize(width, height);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Connect/disconnect audio when audioNode changes
  useEffect(() => {
    if (!visualizerRef.current || !audioNode) return;

    visualizerRef.current.connectAudio(audioNode);

    return () => {
      if (visualizerRef.current && audioNode) {
        try {
          visualizerRef.current.disconnectAudio(audioNode);
        } catch {
          // May already be disconnected
        }
      }
    };
  }, [audioNode]);

  // Render loop
  useEffect(() => {
    if (!isEnabled || mode !== "visualizer" || !isSupported) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    const render = () => {
      if (visualizerRef.current) {
        visualizerRef.current.render();
      }
      animationFrameRef.current = requestAnimationFrame(render);
    };

    animationFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [mode, isSupported, isEnabled]);

  // Initialize visualizer when in visualizer mode and audio is ready
  useEffect(() => {
    if (mode === "visualizer" && audioContext && isSupported) {
      initVisualizer();
    }
  }, [mode, audioContext, isSupported, initVisualizer]);

  // Change preset
  const changePreset = useCallback(async (newIndex: number) => {
    if (!visualizerRef.current || presetNames.length === 0) return;

    try {
      const butterchurnPresets = await import('butterchurn-presets');
      const presets = butterchurnPresets.default.getPresets();
      const preset = presets[presetNames[newIndex]];
      visualizerRef.current.loadPreset(preset, 1.0); // 1 second blend
      setPresetIndex(newIndex);
    } catch (error) {
      console.error('Failed to change preset:', error);
    }
  }, [presetNames]);

  const nextPreset = () => {
    const newIndex = (presetIndex + 1) % presetNames.length;
    changePreset(newIndex);
  };

  const prevPreset = () => {
    const newIndex = (presetIndex - 1 + presetNames.length) % presetNames.length;
    changePreset(newIndex);
  };

  const nextGif = () => {
    setGifIndex((prev) => (prev + 1) % randomGifs.length);
  };

  const prevGif = () => {
    setGifIndex((prev) => (prev - 1 + randomGifs.length) % randomGifs.length);
  };

  const currentGif = customGif || randomGifs[gifIndex];

  const toggleMode = () => {
    setMode(mode === "visualizer" ? "gif" : "visualizer");
  };

  // If butterchurn not supported, fallback to gif only
  const showVisualizerMode = isSupported && mode === "visualizer";

  return (
    <div className={className}>
      <Card>
        <CardContent className="flex flex-col items-center justify-center space-y-2">
          <div
            ref={containerRef}
            className="w-full h-[500px] bg-muted rounded-lg overflow-hidden flex items-center justify-center border-4 border-foreground relative"
          >
            {!isEnabled ? (
              <div className="text-muted-foreground">Visualization Off</div>
            ) : showVisualizerMode ? (
              <canvas
                ref={canvasRef}
                className="w-full h-full block"
              />
            ) : (
              <Image
                src={currentGif}
                alt="Music Visualization"
                width={500}
                height={500}
                className="w-full h-full object-contain"
                style={{ imageRendering: "pixelated" }}
              />
            )}
          </div>

          {/* Carousel Controls */}
          <div className="flex items-center justify-between w-full gap-2">
            {isEnabled && showVisualizerMode && presetNames.length > 0 ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={prevPreset}
                title="Previous preset"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            ) : isEnabled && !showVisualizerMode && !customGif ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={prevGif}
                title="Previous GIF"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            ) : (
              <div className="w-10 h-10" />
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={toggleMode}
              className="flex-1 max-w-56"
              disabled={!isEnabled || isSupported === null || !isSupported}
            >
              {isSupported === null
                ? "Loading..."
                : !isSupported
                  ? "Visualizer not supported"
                  : mode === "visualizer"
                    ? "GIF"
                    : "Visualizer"}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsEnabled(!isEnabled)}
              title={isEnabled ? "Turn off visualization" : "Turn on visualization"}
            >
              {isEnabled ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </Button>

            {isEnabled && showVisualizerMode && presetNames.length > 0 ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={nextPreset}
                title="Next preset"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : isEnabled && !showVisualizerMode && !customGif ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={nextGif}
                title="Next GIF"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <div className="w-10 h-10" />
            )}
          </div>

          {/* Mode indicators */}
          {/* <div className="flex gap-2">
            <button
              onClick={() => isSupported && setMode("visualizer")}
              className={`w-2 h-2 rounded-full transition-colors ${
                mode === "visualizer" && isSupported
                  ? "bg-foreground"
                  : "bg-muted-foreground/30"
              }`}
              disabled={!isSupported}
              aria-label="Visualizer mode"
            />
            <button
              onClick={() => setMode("gif")}
              className={`w-2 h-2 rounded-full transition-colors ${
                mode === "gif" || !isSupported
                  ? "bg-foreground"
                  : "bg-muted-foreground/30"
              }`}
              aria-label="GIF mode"
            />
          </div> */}
        </CardContent>
      </Card>
    </div>
  );
}
