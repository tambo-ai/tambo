'use client'
import { Dialog } from '@/components/ui/dialog';
import { DialogContent } from '@radix-ui/react-dialog';
import { useState } from 'react';

interface ModalImageProps {
    src: string
    alt: string
    width?: number | string
    className?: string
}

export function ModalImage({ src, alt, width, className = '' }: ModalImageProps) {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <>
            <img
                src={src}
                alt={alt}
                width={width}
                className={`cursor-pointer hover:opacity-90 transition-opacity ${className}`}
                onClick={() => setIsOpen(true)}
            />
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="absolute z-100 top-0 left-0 max-w-[90vw] max-h-[90vh] p-0 overflow-hidden">
                    <img
                        src={src}
                        alt={alt}
                        className="w-full h-full object-contain"
                    />
                </DialogContent>
            </Dialog>
        </>
    )
} 