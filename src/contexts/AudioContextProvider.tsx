"use client";

import React, { createContext, useContext, useState, useRef, useCallback } from "react";

interface AudioContextType {
  audioContext: AudioContext | null;
  audioNode: AudioNode | null;
  registerAudioElement: (element: HTMLAudioElement) => void;
  unregisterAudioElement: () => void;
}

const AudioContextContext = createContext<AudioContextType | undefined>(undefined);

export const useAudioContext = () => {
  const context = useContext(AudioContextContext);
  if (context === undefined) {
    throw new Error("useAudioContext must be used within an AudioContextProvider");
  }
  return context;
};

interface AudioContextProviderProps {
  children: React.ReactNode;
}

export const AudioContextProvider: React.FC<AudioContextProviderProps> = ({ children }) => {
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [audioNode, setAudioNode] = useState<AudioNode | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const registeredElementRef = useRef<HTMLAudioElement | null>(null);

  const registerAudioElement = useCallback((element: HTMLAudioElement) => {
    // Don't re-register the same element
    if (registeredElementRef.current === element && audioNode) {
      return;
    }

    // Create AudioContext on first registration (must be from user gesture)
    let ctx = audioContext;
    if (!ctx) {
      ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      setAudioContext(ctx);
    }

    // Resume if suspended
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    // Clean up existing source node if different element
    if (sourceNodeRef.current && registeredElementRef.current !== element) {
      try {
        sourceNodeRef.current.disconnect();
      } catch {
        // May already be disconnected
      }
      sourceNodeRef.current = null;
    }

    // Create MediaElementSourceNode only if not already created for this element
    if (!sourceNodeRef.current) {
      try {
        const source = ctx.createMediaElementSource(element);
        source.connect(ctx.destination);
        sourceNodeRef.current = source;
        registeredElementRef.current = element;
        setAudioNode(source);
      } catch (error) {
        // Element may already have a source node (can only create one per element)
        console.warn('Could not create MediaElementSource:', error);
      }
    }
  }, [audioContext, audioNode]);

  const unregisterAudioElement = useCallback(() => {
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.disconnect();
      } catch {
        // May already be disconnected
      }
      sourceNodeRef.current = null;
      registeredElementRef.current = null;
      setAudioNode(null);
    }
  }, []);

  const value: AudioContextType = {
    audioContext,
    audioNode,
    registerAudioElement,
    unregisterAudioElement,
  };

  return (
    <AudioContextContext.Provider value={value}>
      {children}
    </AudioContextContext.Provider>
  );
};
