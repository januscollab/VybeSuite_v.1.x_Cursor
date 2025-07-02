import { debug } from '../utils/debug';
import React from 'react';
interface PulsingDotsLoaderProps {
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}
export const PulsingDotsLoader: React.FC<PulsingDotsLoaderProps> = ({ size = 'md', className = '' }) => {
    const sizeConfig = {
        sm: { dotSize: '8px', gap: '6px' },
        md: { dotSize: '12px', gap: '8px' },
        lg: { dotSize: '16px', gap: '10px' }
    };
    const config = sizeConfig[size];
    return (<div className={`pulsing-dots-loader ${className}`}>
      <div className="dot dot-1"></div>
      <div className="dot dot-2"></div>
      <div className="dot dot-3"></div>
      
      <style>{`
        .pulsing-dots-loader {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: ${config.gap};
        }

        .dot {
          width: ${config.dotSize};
          height: ${config.dotSize};
          background-color: var(--devsuite-primary, #FC8019);
          border-radius: 50%;
          animation: pulse-dot 1.4s ease-in-out infinite;
        }

        .dot-1 {
          animation-delay: 0s;
        }

        .dot-2 {
          animation-delay: 0.16s;
        }

        .dot-3 {
          animation-delay: 0.32s;
        }

        @keyframes pulse-dot {
          0%, 80%, 100% {
            transform: scale(0.6);
            opacity: 0.5;
          }
          40% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>);
};
// Export as default for backward compatibility
export default PulsingDotsLoader;
// Also export as LoadingSpinner for existing imports
export const LoadingSpinner = PulsingDotsLoader;
