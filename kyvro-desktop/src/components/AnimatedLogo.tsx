import React, { useEffect, useRef, useState } from 'react';
import { KyvroLogoAnimation } from '@/assets/animations/KyvroLogo';
import { BackgroundAnimation } from '@/assets/animations/BackgroundAnimation';
import { LoadingAnimation } from '@/assets/animations/LoadingAnimation';

interface AnimatedLogoProps {
  type?: 'logo' | 'background' | 'loading';
  progress?: number;
  onComplete?: () => void;
  className?: string;
}

const AnimatedLogo: React.FC<AnimatedLogoProps> = ({
  type = 'logo',
  progress = 0,
  onComplete,
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<any>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize animation based on type
    switch (type) {
      case 'logo':
        animationRef.current = new KyvroLogoAnimation(containerRef.current);
        break;
      case 'background':
        animationRef.current = new BackgroundAnimation(containerRef.current);
        break;
      case 'loading':
        animationRef.current = new LoadingAnimation(containerRef.current);
        break;
    }

    setIsReady(true);

    // Handle window resize
    const handleResize = () => {
      if (animationRef.current) {
        animationRef.current.resize();
      }
    };

    window.addEventListener('resize', handleResize);

    // Play intro animation
    if (animationRef.current && animationRef.current.playIntroAnimation) {
      animationRef.current.playIntroAnimation();
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationRef.current) {
        animationRef.current.destroy();
      }
    };
  }, [type]);

  useEffect(() => {
    if (type === 'loading' && animationRef.current && progress > 0) {
      animationRef.current.updateProgress(progress);
      
      if (progress === 100 && onComplete) {
        animationRef.current.playCompletionAnimation();
        setTimeout(onComplete, 2000); // Wait for completion animation
      }
    }
  }, [progress, type, onComplete]);

  const handleMouseEnter = () => {
    if (animationRef.current && animationRef.current.playHoverAnimation) {
      animationRef.current.playHoverAnimation();
    }
  };

  const handleClick = () => {
    if (animationRef.current && animationRef.current.playClickAnimation) {
      animationRef.current.playClickAnimation();
    }
  };

  return (
    <div 
      ref={containerRef} 
      className={`w-full h-full ${className}`}
      onMouseEnter={handleMouseEnter}
      onClick={handleClick}
    >
      {!isReady && (
        <div className="flex items-center justify-center w-full h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
        </div>
      )}
    </div>
  );
};

export default AnimatedLogo;
