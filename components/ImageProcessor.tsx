'use client';

import React, { useState, useRef, useEffect } from 'react';
import { WebGLMatrixEffect } from '../lib/imageProcessing';
import ControlPanel from './ControlPanel';
import ImageUploader from './ImageUploader';

interface ProcessorSettings {
    colorShift: number;
    contrast: number;
    brightness: number;
}

const ImageProcessor: React.FC = () => {
    const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);
    const [loading, setLoading] = useState(false);
    const originalCanvasRef = useRef<HTMLCanvasElement>(null);
    const resultCanvasRef = useRef<HTMLCanvasElement>(null);
    const webglEffect = useRef<WebGLMatrixEffect | null>(null);

    const [settings, setSettings] = useState<ProcessorSettings>({
        colorShift: 0.3,
        contrast: 1.4,
        brightness: 1.1,
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
        if (!originalImage || !webglEffect.current) return;
        setLoading(true);
        webglEffect.current.processImage(originalImage, settings);
        setLoading(false);
    };

    const downloadResult = () => {
        if (!webglEffect.current) return;
        const canvas = webglEffect.current.getCanvas();
        const link = document.createElement('a');
        link.download = 'matrix_style_photo.png';
        link.href = canvas.toDataURL();
        link.click();
    };
    
    useEffect(() => {
        if (resultCanvasRef.current && !webglEffect.current) {
            try {
                webglEffect.current = new WebGLMatrixEffect(resultCanvasRef.current);
            } catch (error) {
                console.error(error);
                alert("It seems your browser doesn't support WebGL, which is required for this effect.");
            }
        }
    }, []);

    useEffect(() => {
        if (originalImage && originalCanvasRef.current) {
            drawImageToCanvas(originalCanvasRef.current, originalImage);
        }
        if (originalImage && webglEffect.current) {
            processImage();
        }
    }, [originalImage]);
    
    useEffect(() => {
        if (originalImage && webglEffect.current) {
            const handler = setTimeout(() => processImage(), 50); // Debounce for performance
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