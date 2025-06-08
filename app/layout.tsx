import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
    title: 'Matrix Style Photo Processor',
    description: 'Convert your photos into a Matrix-style image.',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
} 