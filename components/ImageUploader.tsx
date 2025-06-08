'use client';

import React, { useRef } from 'react';

interface ImageUploaderProps {
    onImageUpload: (imageDataUrl: string) => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (loadEvent) => {
                if (loadEvent.target?.result) {
                    onImageUpload(loadEvent.target.result as string);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleButtonClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                style={{ display: 'none' }}
            />
            <button onClick={handleButtonClick}>Upload Image</button>
        </div>
    );
};

export default ImageUploader; 