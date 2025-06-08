'use client';

import React, { useState, useRef, useEffect } from 'react';
import { applyMatrixEffect, addCRTDistortion, MatrixEffectOptions } from '../lib/imageProcessing';
import ControlPanel from './ControlPanel';
import ImageUploader from './ImageUploader';

interface ProcessorSettings extends MatrixEffectOptions {
    useAmber: boolean;
    useCRTDistortion: boolean;
    curvature: number;
    vignetteIntensity: number;
    glowIntensity: number;
    scanlineIntensity: number;
}

const ImageProcessor: React.FC = () => {
    const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);
    const [processedImageData, setProcessedImageData] = useState<ImageData | null>(null);
    const [loading, setLoading] = useState(false);
    const originalCanvasRef = useRef<HTMLCanvasElement>(null);
    const resultCanvasRef = useRef<HTMLCanvasElement>(null);

    const [settings, setSettings] = useState<ProcessorSettings>({
        mappingIntensity: 0.95,
        contrast: 1.4,
        brightness: 1.1,
        glowIntensity: 0.3,
        scanlineIntensity: 0.15,
        useAmber: false,
        useCRTDistortion: true,
        curvature: 0.02,
        vignetteIntensity: 0.3,
    });

    const drawImageToCanvas = (canvas: HTMLCanvasElement, image: HTMLImageElement) => {
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const maxWidth = 400;
        const scale = Math.min(maxWidth / image.width, 1);
        canvas.width = image.width * scale;
        canvas.height = image.height * scale;
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    };

    const handleImageUpload = (imageDataUrl: string) => {
        const img = new Image();
        img.onload = () => {
            setOriginalImage(img);
        };
        img.src = imageDataUrl;
    };

    const processImage = () => {
        if (!originalImage || !originalCanvasRef.current) return;

        setLoading(true);

        drawImageToCanvas(originalCanvasRef.current, originalImage);
        const originalCtx = originalCanvasRef.current.getContext('2d');
        if (!originalCtx) {
            setLoading(false);
            return;
        }

        const originalImageData = originalCtx.getImageData(0, 0, originalCanvasRef.current.width, originalCanvasRef.current.height);

        setTimeout(() => {
            const { useAmber, useCRTDistortion, curvature, vignetteIntensity, ...matrixOptions } = settings;
            
            let newImageData = applyMatrixEffect(originalImageData, matrixOptions, useAmber);
            
            if (useCRTDistortion) {
                newImageData = addCRTDistortion(newImageData, curvature, vignetteIntensity);
            }

            setProcessedImageData(newImageData);
            setLoading(false);
        }, 100);
    };

    const downloadResult = () => {
        if (!resultCanvasRef.current) return;
        const link = document.createElement('a');
        link.download = 'matrix_style_photo.png';
        link.href = resultCanvasRef.current.toDataURL();
        link.click();
    };

    useEffect(() => {
        if (originalImage && originalCanvasRef.current) {
            drawImageToCanvas(originalCanvasRef.current, originalImage);
            processImage();
        }
    }, [originalImage]);

    useEffect(() => {
        if (processedImageData && resultCanvasRef.current) {
            const resultCtx = resultCanvasRef.current.getContext('2d');
            if(resultCtx) {
                resultCanvasRef.current.width = processedImageData.width;
                resultCanvasRef.current.height = processedImageData.height;
                resultCtx.putImageData(processedImageData, 0, 0);
            }
        }
    }, [processedImageData]);
    
    useEffect(() => {
        if (originalImage) {
            const handler = setTimeout(() => processImage(), 100);
            return () => clearTimeout(handler);
        }
    }, [settings, originalImage]);


    return (
        <div className="container">
            <h1>MATRIX STYLE PHOTO PROCESSOR</h1>

            <div style={{textAlign: 'center', marginBottom: '20px'}}>
                <ImageUploader onImageUpload={handleImageUpload} />
            </div>

            <div className="images-container">
                <div className="image-section">
                    <h3>Original Photo</h3>
                    <canvas ref={originalCanvasRef}></canvas>
                    {!originalImage && <p>Upload an image to begin.</p>}
                </div>
                <div className="image-section">
                    <h3>Matrix Styled Result</h3>
                    <canvas ref={resultCanvasRef}></canvas>
                </div>
            </div>

            <ControlPanel 
                settings={settings}
                onSettingsChange={setSettings}
                onApply={processImage}
                onDownload={downloadResult}
            />

            {loading && (
                <div id="loading" className="loading">
                    Processing... Entering the Matrix...
                </div>
            )}
        </div>
    );
};

export default ImageProcessor; 