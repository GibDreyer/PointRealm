import React from 'react';
import { motion } from 'framer-motion';

export const PortalPreviewCard: React.FC = () => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut", delay: 0.1 }}
      className="relative w-full max-w-sm mx-auto overflow-hidden border rounded-xl select-none"
      style={{
        backgroundColor: 'var(--pr-surface-elevated)',
        borderColor: 'var(--pr-border)',
        boxShadow: 'var(--pr-shadow-soft)',
      }}
    >
      {/* Header with Title and Code */}
      <div className="p-6 pb-4">
        <h3 
          className="text-lg font-bold mb-1"
          style={{ fontFamily: 'var(--pr-heading-font)', color: 'var(--pr-text)' }}
        >
          Enter a Realm
        </h3>
        <p 
          className="text-sm mb-4"
          style={{ color: 'var(--pr-text-muted)' }}
        >
          A place where parties forge an estimate.
        </p>

        {/* Fake Code Pill */}
        <div 
          className="inline-flex items-center justify-center px-4 py-2 font-mono text-xl font-bold rounded-lg w-full mb-2 tracking-widest"
          style={{ 
            backgroundColor: 'rgba(0,0,0,0.3)', 
            color: 'var(--pr-primary)',
            fontFamily: 'var(--pr-mono-font)',
            border: '1px solid var(--pr-border)'
          }}
        >
          PR-7K3Q
        </div>
      </div>

      {/* Rune Divider */}
      <div className="flex items-center justify-center py-2 opacity-50">
        <svg width="100%" height="16" viewBox="0 0 200 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 8H90L100 8L110 8H200" stroke="var(--pr-border)" strokeWidth="1"/>
          <path d="M100 4L104 8L100 12L96 8L100 4Z" fill="var(--pr-secondary)"/>
        </svg>
      </div>

      {/* Rune Cards Section */}
      <div className="p-6 pt-2 bg-black/20">
        <div className="flex justify-between items-center space-x-2">
          {[1, 2, 3, 5, 8].map((val, i) => (
            <div 
              key={val}
              className="h-16 w-10 rounded border flex items-center justify-center relative"
              style={{
                backgroundColor: 'var(--pr-surface)',
                borderColor: 'var(--pr-border)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
                transform: `rotate(${i % 2 === 0 ? 2 : -2}deg)`
              }}
            >
              <span 
                className="font-bold text-sm"
                style={{ color: 'var(--pr-text-muted)' }}
              >
                {val}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Glow Effect (Subtle) under header */}
      <div 
        className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl pointer-events-none"
        style={{
          background: 'var(--pr-primary)',
          opacity: 0.1,
          transform: 'translate(40%, -40%)'
        }}
      />
    </motion.div>
  );
};
