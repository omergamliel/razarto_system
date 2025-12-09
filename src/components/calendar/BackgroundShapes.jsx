import React from 'react';
import { motion } from 'framer-motion';

export default function BackgroundShapes() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Shape 1 - Top Right */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.4, scale: 1 }}
        transition={{ duration: 2, ease: "easeOut" }}
        className="absolute -top-32 -right-32 w-96 h-96 rounded-full"
        style={{
          background: 'linear-gradient(135deg, rgba(229, 115, 115, 0.15) 0%, rgba(229, 115, 115, 0.05) 100%)',
          filter: 'blur(40px)',
        }}
      />
      
      {/* Shape 2 - Bottom Left */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.35, scale: 1 }}
        transition={{ duration: 2.5, delay: 0.3, ease: "easeOut" }}
        className="absolute -bottom-48 -left-48 w-[500px] h-[500px] rounded-full"
        style={{
          background: 'linear-gradient(45deg, rgba(100, 181, 246, 0.12) 0%, rgba(100, 181, 246, 0.03) 100%)',
          filter: 'blur(50px)',
        }}
      />
      
      {/* Shape 3 - Center */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.2 }}
        transition={{ duration: 3, delay: 0.5 }}
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px]"
        style={{
          background: 'radial-gradient(circle, rgba(229, 115, 115, 0.08) 0%, transparent 70%)',
        }}
      />
      
      {/* Shape 4 - Top Left accent */}
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 0.25, x: 0 }}
        transition={{ duration: 2, delay: 0.8 }}
        className="absolute top-20 left-20 w-64 h-64 rounded-full"
        style={{
          background: 'linear-gradient(180deg, rgba(100, 181, 246, 0.1) 0%, transparent 100%)',
          filter: 'blur(30px)',
        }}
      />
      
      {/* Floating dots pattern */}
      <div className="absolute inset-0 opacity-[0.03]">
        <svg width="100%" height="100%">
          <pattern id="dots" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1" fill="#64B5F6" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#dots)" />
        </svg>
      </div>
    </div>
  );
}