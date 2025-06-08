'use client';

import React from 'react';

interface ControlPanelProps {
    settings: {
        colorShift: number;
        contrast: number;
        brightness: number;
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

    return (
        <div className="controls">
            <div className="slider-container">
                <label htmlFor="colorShift">Color Shift:</label>
                <input
                    type="range"
                    id="colorShift"
                    min="0"
                    max="1"
                    step="0.05"
                    value={settings.colorShift}
                    onChange={handleSliderChange}
                />
                <span>{settings.colorShift.toFixed(2)}</span>
            </div>
            <div className="slider-container">
                <label htmlFor="contrast">Contrast:</label>
                <input
                    type="range"
                    id="contrast"
                    min="0.5"
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
            <br />
            <button onClick={onApply}>Apply Matrix Style</button>
            <button onClick={onDownload}>Download Result</button>
        </div>
    );
};

export default ControlPanel; 