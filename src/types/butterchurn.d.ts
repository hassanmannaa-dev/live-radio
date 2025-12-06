declare module 'butterchurn' {
  interface VisualizerOptions {
    width: number;
    height: number;
    pixelRatio?: number;
    textureRatio?: number;
    meshWidth?: number;
    meshHeight?: number;
  }

  interface Visualizer {
    connectAudio(audioNode: AudioNode): void;
    disconnectAudio(audioNode: AudioNode): void;
    loadPreset(preset: object, blendTime?: number): void;
    setRendererSize(width: number, height: number): void;
    render(): void;
    launchSongTitleAnim(title: string): void;
  }

  interface Butterchurn {
    createVisualizer(
      audioContext: AudioContext,
      canvas: HTMLCanvasElement,
      options: VisualizerOptions
    ): Visualizer;
  }

  const butterchurn: Butterchurn;
  export default butterchurn;
}

declare module 'butterchurn-presets' {
  interface Presets {
    [key: string]: object;
  }

  interface ButterchurnPresets {
    getPresets(): Presets;
  }

  const butterchurnPresets: ButterchurnPresets;
  export default butterchurnPresets;
}

declare module 'butterchurn/lib/isSupported.min' {
  function isButterchurnSupported(): boolean;
  export default isButterchurnSupported;
}
