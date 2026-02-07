'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface SnoopDanceOverlayProps {
    isOpen: boolean;
    onClose: () => void;
}

export function SnoopDanceOverlay({ isOpen, onClose }: SnoopDanceOverlayProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
            const timer = setTimeout(() => {
                onClose();
            }, 5000);
            return () => clearTimeout(timer);
        } else {
            setIsVisible(false);
        }
    }, [isOpen, onClose]);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.1 }}
                    className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/90 backdrop-blur-xl scanlines"
                >
                    {/* Retro Grain Effect Overlay */}
                    <div className="pointer-events-none absolute inset-0 opacity-20 mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

                    {/* Main Content Container */}
                    <div className="relative flex flex-col items-center gap-8 p-8 neon-border glossy-panel max-w-2xl w-full mx-4">
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 text-primary hover:text-white transition-colors"
                        >
                            <X className="h-6 w-6" />
                        </button>

                        <div className="space-y-2 text-center">
                            <motion.h2
                                animate={{
                                    textShadow: [
                                        "0 0 10px #00ff41, 0 0 20px #00ff41",
                                        "0 0 5px #00ff41, 0 0 10px #00ff41",
                                        "0 0 15px #00ff41, 0 0 30px #00ff41"
                                    ],
                                    opacity: [1, 0.8, 1, 0.9, 1]
                                }}
                                transition={{ repeat: Infinity, duration: 0.2 }}
                                className="text-5xl md:text-7xl font-mono font-black italic tracking-tighter text-primary"
                            >
                                PAID IN FULL
                            </motion.h2>
                            <p className="text-xl font-mono text-muted-foreground animate-pulse">
                                STACKIN' THAT PAPER
                            </p>
                        </div>

                        <div className="relative group">
                            <div className="absolute -inset-4 bg-primary/20 blur-xl rounded-full opacity-50 group-hover:opacity-100 transition-opacity animate-pulse" />
                            <div className="relative rounded-lg overflow-hidden border-4 border-primary/50 shadow-[0_0_50px_rgba(0,255,65,0.3)]">
                                <Image
                                    src="/snoop-dance.gif"
                                    alt="Snoop Dogg Dance"
                                    width={400}
                                    height={400}
                                    className="grayscale hover:grayscale-0 transition-all duration-500"
                                    unoptimized
                                />
                            </div>
                        </div>

                        <div className="flex flex-col items-center gap-4">
                            <div className="parental-advisory scale-150 mb-4">
                                PARENTAL ADVISORY: EXPLICIT GAINS
                            </div>

                            <button
                                onClick={onClose}
                                className="px-8 py-3 bg-primary text-black font-mono font-bold italic hover:bg-white hover:scale-105 transition-all uppercase tracking-widest"
                            >
                                BACK TO THE GRIND
                            </button>
                        </div>

                        {/* Corner Accents */}
                        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-primary" />
                        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-primary" />
                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-primary" />
                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-primary" />
                    </div>

                    {/* Scrolling background text */}
                    <div className="absolute top-10 left-0 w-full overflow-hidden opacity-10 whitespace-nowrap font-mono text-primary text-2xl select-none">
                        <motion.div
                            animate={{ x: [-1000, 0] }}
                            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        >
                            SNOOP DOGG • DR. DRE • 2001 • AFTERMATH • DOGGYSTYLE • CHRONIC • THE NEXT EPISODE • STILL D.R.E. •
                            SNOOP DOGG • DR. DRE • 2001 • AFTERMATH • DOGGYSTYLE • CHRONIC • THE NEXT EPISODE • STILL D.R.E. •
                        </motion.div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
