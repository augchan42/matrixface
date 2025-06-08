'use client';

import React from 'react';

interface ControlPanelProps {
    settings: {
        mappingIntensity: number;
        contrast: number;
        brightness: number;
        glowIntensity: number;
        scanlineIntensity: number;
        useAmber: boolean;
        useCRTDistortion: boolean;
        curvature: number;
        vignetteIntensity: number;
    };
    onSettingsChange: (newSettings: any) => void;
    onApply: () => void;
    onDownload: () => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ settings, onSettingsChange, onApply, onDownload }) => {
    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        onSettingsChange({ ...settings, [id]: parseFloat(value) });
    };

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, checked } = e.target;
        onSettingsChange({ ...settings, [id]: checked });
    };

    const handlePaletteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onSettingsChange({ ...settings, useAmber: e.target.value === 'amber' });
    };

    return (
        <div className="controls">
            <div className="slider-container">
                <label htmlFor="mappingIntensity">Mapping Intensity:</label>
                <input
                    type="range"
                    id="mappingIntensity"
                    min="0"
                    max="1"
                    step="0.05"
                    value={settings.mappingIntensity}
                    onChange={handleSliderChange}
                />
                <span>{settings.mappingIntensity.toFixed(2)}</span>
            </div>
            <div className="slider-container">
                <label htmlFor="contrast">Contrast:</label>
                <input
                    type="range"
                    id="contrast"
                    min="0.8"
                    max="2.5"
                    step="0.1"
                    value={settings.contrast}
                    onChange={handleSliderChange}
                />
                <span>{settings.contrast.toFixed(1)}</span>
            </div>
            <div className="slider-container">
                <label htmlFor="brightness">Brightness:</label>
                <input
                    type="range"
                    id="brightness"
                    min="0.5"
                    max="1.5"
                    step="0.05"
                    value={settings.brightness}
                    onChange={handleSliderChange}
                />
                <span>{settings.brightness.toFixed(2)}</span>
            </div>
            <div className="slider-container">
                <label htmlFor="glowIntensity">Glow Intensity:</label>
                <input
                    type="range"
                    id="glowIntensity"
                    min="0"
                    max="1"
                    step="0.05"
                    value={settings.glowIntensity}
                    onChange={handleSliderChange}
                />
                <span>{settings.glowIntensity.toFixed(2)}</span>
            </div>
            <div className="slider-container">
                <label htmlFor="scanlineIntensity">Scanline Intensity:</label>
                <input
                    type="range"
                    id="scanlineIntensity"
                    min="0"
                    max="0.5"
                    step="0.01"
                    value={settings.scanlineIntensity}
                    onChange={handleSliderChange}
                />
                <span>{settings.scanlineIntensity.toFixed(2)}</span>
            </div>

            <div className="slider-container">
                <label>Color Palette:</label>
                <label style={{margin: "0 10px"}}>
                    <input type="radio" value="green" checked={!settings.useAmber} onChange={handlePaletteChange} />
                    Green
                </label>
                <label style={{margin: "0 10px"}}>
                    <input type="radio" value="amber" checked={settings.useAmber} onChange={handlePaletteChange} />
                    Amber
                </label>
            </div>
            
            <div className="slider-container">
                <label htmlFor="useCRTDistortion">CRT Distortion:</label>
                <input
                    type="checkbox"
                    id="useCRTDistortion"
                    checked={settings.useCRTDistortion}
                    onChange={handleCheckboxChange}
                />
            </div>

            {settings.useCRTDistortion && (
                <>
                    <div className="slider-container">
                        <label htmlFor="curvature">Curvature:</label>
                        <input
                            type="range"
                            id="curvature"
                            min="0"
                            max="0.1"
                            step="0.005"
                            value={settings.curvature}
                            onChange={handleSliderChange}
                        />
                        <span>{settings.curvature.toFixed(3)}</span>
                    </div>
                    <div className="slider-container">
                        <label htmlFor="vignetteIntensity">Vignette:</label>
                        <input
                            type="range"
                            id="vignetteIntensity"
                            min="0"
                            max="0.7"
                            step="0.05"
                            value={settings.vignetteIntensity}
                            onChange={handleSliderChange}
                        />
                        <span>{settings.vignetteIntensity.toFixed(2)}</span>
                    </div>
                </>
            )}
            <br />
            <button onClick={onApply}>Apply Matrix Style</button>
            <button onClick={onDownload}>Download Result</button>
        </div>
    );
};

export default ControlPanel; 