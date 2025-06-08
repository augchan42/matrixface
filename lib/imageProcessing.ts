export interface MatrixEffectOptions {
  mappingIntensity: number;
  contrast: number;
  brightness: number;
  glowIntensity?: number;
  scanlineIntensity?: number;
}

function lerp(a: number, b: number, t: number): number {
  return a * (1 - t) + b * t;
}

// Enhanced color ramp for retro CRT phosphor green effect
const colorRamp = [
  { stop: 0, color: [0, 8, 0] }, // Deep black with slight green tint
  { stop: 30, color: [0, 20, 5] }, // Very dark green
  { stop: 60, color: [5, 40, 10] }, // Dark phosphor green
  { stop: 100, color: [15, 80, 20] }, // Mid-dark green
  { stop: 140, color: [30, 120, 40] }, // Classic terminal green
  { stop: 180, color: [60, 180, 70] }, // Bright phosphor green
  { stop: 220, color: [100, 220, 110] }, // Very bright green
  { stop: 255, color: [150, 255, 160] }, // Peak phosphor glow
];

// Alternative vintage amber/orange CRT palette
const amberRamp = [
  { stop: 0, color: [10, 5, 0] },
  { stop: 40, color: [40, 20, 0] },
  { stop: 80, color: [80, 40, 5] },
  { stop: 120, color: [140, 70, 10] },
  { stop: 160, color: [200, 100, 15] },
  { stop: 200, color: [240, 140, 20] },
  { stop: 255, color: [255, 180, 30] },
];

export function applyMatrixEffect(
  originalImageData: ImageData,
  options: MatrixEffectOptions,
  useAmber: boolean = false
): ImageData {
  const {
    mappingIntensity,
    contrast,
    brightness,
    glowIntensity = 0.3,
    scanlineIntensity = 0.15,
  } = options;

  const newImageData = new ImageData(
    originalImageData.width,
    originalImageData.height
  );
  const data = newImageData.data;
  const originalData = originalImageData.data;
  const width = originalImageData.width;
  const height = originalImageData.height;

  // Choose color palette
  const activeRamp = useAmber ? amberRamp : colorRamp;

  // First pass: apply color mapping
  for (let i = 0; i < originalData.length; i += 4) {
    const r = originalData[i];
    const g = originalData[i + 1];
    const b = originalData[i + 2];
    const a = originalData[i + 3];

    // Convert to grayscale with adjusted weights for better contrast
    const gray = 0.299 * r + 0.587 * g + 0.114 * b;

    // Apply a slight S-curve for more dramatic contrast
    const curveGray = Math.pow(gray / 255, 0.8) * 255;

    // Find the appropriate color stops
    let c1, c2;
    for (let j = 0; j < activeRamp.length - 1; j++) {
      if (
        curveGray >= activeRamp[j].stop &&
        curveGray <= activeRamp[j + 1].stop
      ) {
        c1 = activeRamp[j];
        c2 = activeRamp[j + 1];
        break;
      }
    }

    if (!c1 || !c2) {
      if (curveGray < activeRamp[0].stop) {
        c1 = activeRamp[0];
        c2 = activeRamp[0];
      } else {
        c1 = activeRamp[activeRamp.length - 1];
        c2 = activeRamp[activeRamp.length - 1];
      }
    }

    const t = c1 === c2 ? 0 : (curveGray - c1.stop) / (c2.stop - c1.stop);

    const mappedR = lerp(c1.color[0], c2.color[0], t);
    const mappedG = lerp(c1.color[1], c2.color[1], t);
    const mappedB = lerp(c1.color[2], c2.color[2], t);

    // Blend with original grayscale based on mapping intensity
    let finalR = lerp(gray, mappedR, mappingIntensity);
    let finalG = lerp(gray, mappedG, mappingIntensity);
    let finalB = lerp(gray, mappedB, mappingIntensity);

    // Apply contrast and brightness adjustments
    finalR = ((finalR - 128) * contrast + 128) * brightness;
    finalG = ((finalG - 128) * contrast + 128) * brightness;
    finalB = ((finalB - 128) * contrast + 128) * brightness;

    // Store pixel data
    data[i] = Math.max(0, Math.min(255, finalR));
    data[i + 1] = Math.max(0, Math.min(255, finalG));
    data[i + 2] = Math.max(0, Math.min(255, finalB));
    data[i + 3] = a;
  }

  // Second pass: add CRT effects
  const tempData = new Uint8ClampedArray(data);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;

      // Add horizontal scanlines
      const scanline = y % 3 === 0 ? 1 - scanlineIntensity : 1;

      // Add phosphor glow bloom effect
      let glowR = tempData[idx];
      let glowG = tempData[idx + 1];
      let glowB = tempData[idx + 2];

      // Sample neighboring pixels for glow
      const sampleRadius = 2;
      let glowSamples = 0;

      for (let dy = -sampleRadius; dy <= sampleRadius; dy++) {
        for (let dx = -sampleRadius; dx <= sampleRadius; dx++) {
          const sx = x + dx;
          const sy = y + dy;

          if (sx >= 0 && sx < width && sy >= 0 && sy < height) {
            const sIdx = (sy * width + sx) * 4;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const weight = Math.max(0, 1 - distance / sampleRadius);

            glowR += tempData[sIdx] * weight * glowIntensity;
            glowG += tempData[sIdx + 1] * weight * glowIntensity;
            glowB += tempData[sIdx + 2] * weight * glowIntensity;
            glowSamples += weight;
          }
        }
      }

      if (glowSamples > 0) {
        glowR /= 1 + glowSamples * glowIntensity;
        glowG /= 1 + glowSamples * glowIntensity;
        glowB /= 1 + glowSamples * glowIntensity;
      }

      // Apply scanline and glow effects
      data[idx] = Math.min(255, glowR * scanline);
      data[idx + 1] = Math.min(255, glowG * scanline);
      data[idx + 2] = Math.min(255, glowB * scanline);
    }
  }

  return newImageData;
}

// Additional function for adding CRT distortion effects
export function addCRTDistortion(
  imageData: ImageData,
  curvature: number = 0.02,
  vignetteIntensity: number = 0.3
): ImageData {
  const newImageData = new ImageData(imageData.width, imageData.height);
  const data = newImageData.data;
  const originalData = imageData.data;
  const width = imageData.width;
  const height = imageData.height;
  const centerX = width / 2;
  const centerY = height / 2;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Barrel distortion for CRT curvature
      const dx = (x - centerX) / centerX;
      const dy = (y - centerY) / centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const factor = 1 + dist * dist * curvature;

      const srcX = Math.floor(centerX + (x - centerX) / factor);
      const srcY = Math.floor(centerY + (y - centerY) / factor);

      const idx = (y * width + x) * 4;

      if (srcX >= 0 && srcX < width && srcY >= 0 && srcY < height) {
        const srcIdx = (srcY * width + srcX) * 4;

        // Apply vignette effect
        const vignette = 1 - dist * vignetteIntensity;

        data[idx] = originalData[srcIdx] * vignette;
        data[idx + 1] = originalData[srcIdx + 1] * vignette;
        data[idx + 2] = originalData[srcIdx + 2] * vignette;
        data[idx + 3] = originalData[srcIdx + 3];
      } else {
        // Black outside the distortion area
        data[idx] = 0;
        data[idx + 1] = 0;
        data[idx + 2] = 0;
        data[idx + 3] = 255;
      }
    }
  }

  return newImageData;
}
