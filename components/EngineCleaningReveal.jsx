import React, { useRef, useEffect, useState } from 'react';

/**
 * EngineCleaningReveal - Premium Interactive Before/After Comparison Showcase
 *
 * Props:
 * - beforeImage (string): Path to the dirty engine image (BEFORE)
 * - afterImage (string): Path to the clean engine image (AFTER)
 * - initialX (number): Initial X coordinate percentage (default: 50)
 * - initialY (number): Initial Y coordinate percentage (default: 50)
 */
export const EngineCleaningReveal = ({
  beforeImage = '/assets/images/image1.png',
  afterImage = '/assets/images/image2.png',
  initialX = 50,
  initialY = 50,
}) => {
  const containerRef = useRef(null);
  const frameRef = useRef(null);

  const [coords, setCoords] = useState({ x: initialX, y: initialY });
  const [isHovered, setIsHovered] = useState(false);

  // Animation values for smooth linear interpolation (lerp)
  const targetXRef = useRef(initialX);
  const targetYRef = useRef(initialY);
  const currentXRef = useRef(initialX);
  const currentYRef = useRef(initialY);
  const [revealRadius, setRevealRadius] = useState(80);

  // Update target coordinates relative to the frame element
  const updateCoordinates = (clientX, clientY) => {
    if (!frameRef.current) return;
    const rect = frameRef.current.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    
    // Clamp values between 0 and 100
    targetXRef.current = Math.max(0, Math.min(100, x));
    targetYRef.current = Math.max(0, Math.min(100, y));
  };

  // Handle desktop mouse move
  const handleMouseMove = (e) => {
    updateCoordinates(e.clientX, e.clientY);
  };

  // Handle mobile touch drag
  const handleTouchMove = (e) => {
    if (e.touches && e.touches.length > 0) {
      updateCoordinates(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleTouchStart = (e) => {
    setIsHovered(true);
    if (e.touches && e.touches.length > 0) {
      updateCoordinates(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  useEffect(() => {
    let animationFrameId;
    const ease = 0.15; // Smooth easing coefficient

    const animate = () => {
      // Lerp logic
      currentXRef.current += (targetXRef.current - currentXRef.current) * ease;
      currentYRef.current += (targetYRef.current - currentYRef.current) * ease;

      // Update state to trigger re-renders or directly set custom CSS variables on container
      if (containerRef.current) {
        containerRef.current.style.setProperty('--reveal-x', `${currentXRef.current}%`);
        containerRef.current.style.setProperty('--reveal-y', `${currentYRef.current}%`);
        
        // Dynamically calculate responsive radius based on current card width
        const width = frameRef.current?.offsetWidth || 400;
        const computedRadius = Math.max(60, Math.min(90, width * 0.18));
        setRevealRadius(computedRadius);
        containerRef.current.style.setProperty('--reveal-radius', `${computedRadius}px`);
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="engine-cleaning-reveal"
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: '520px',
        aspectRatio: '4 / 3',
        borderRadius: '20px',
        background: 'rgba(255, 255, 255, 0.45)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        border: '1px solid rgba(27, 26, 23, 0.08)',
        boxShadow: '0 20px 45px rgba(27, 26, 23, 0.06)',
        padding: '14px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        animation: 'engineFloat 6s ease-in-out infinite',
      }}
    >
      <div
        ref={frameRef}
        className="engine-cleaning-frame"
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={() => setIsHovered(false)}
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          cursor: 'none',
          borderRadius: '12px',
          background: '#fbf9f6',
          border: '1px solid rgba(27, 26, 23, 0.04)',
          display: 'flex',
          alignItems: 'center',
          justify-content: center,
        }}
      >
        {/* Dirty Engine (BEFORE) - Visible underneath */}
        <img
          src={beforeImage}
          alt="Before dirty engine"
          className="engine-image engine-before"
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            pointerEvents: 'none',
            userSelect: 'none',
            zIndex: 1,
          }}
        />

        {/* Spotless Engine (AFTER) - Clipped to glowing circle */}
        <img
          src={afterImage}
          alt="After clean engine"
          className="engine-image engine-after"
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            pointerEvents: 'none',
            userSelect: 'none',
            zIndex: 2,
            clipPath: 'circle(var(--reveal-radius, 80px) at var(--reveal-x, 50%) var(--reveal-y, 50%))',
            willChange: 'clip-path',
          }}
        />

        {/* Glowing circular cleaning brush brush indicator */}
        <div
          className="engine-halo"
          style={{
            position: 'absolute',
            width: `${revealRadius * 2}px`,
            height: `${revealRadius * 2}px`,
            borderRadius: '50%',
            border: '2px solid rgba(245, 197, 24, 0.95)',
            background: 'radial-gradient(circle, rgba(245, 197, 24, 0.18) 0%, rgba(245, 197, 24, 0.02) 70%, transparent 100%)',
            boxShadow: '0 0 18px rgba(245, 197, 24, 0.45), inset 0 0 12px rgba(245, 197, 24, 0.3)',
            pointerEvents: 'none',
            zIndex: 3,
            transform: 'translate(-50%, -50%)',
            left: 'var(--reveal-x, 50%)',
            top: 'var(--reveal-y, 50%)',
            opacity: isHovered ? 1 : 0,
            transition: 'opacity 0.3s ease',
            willChange: 'left, top, opacity',
          }}
        />
      </div>
      
      {/* Interaction Help Text */}
      <div
        className="reveal-hint-overlay"
        style={{
          textAlign: 'center',
          paddingTop: '10px',
          fontSize: '0.8rem',
          fontWeight: 700,
          color: '#8d877a',
          letterSpacing: '0.5px',
          textTransform: 'uppercase',
        }}
      >
        <span>← Move mouse or swipe to clean →</span>
      </div>

      {/* Styled animation keyframes (injected globally or via standard stylesheet) */}
      <style>{`
        @keyframes engineFloat {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(0.5deg); }
        }
      `}</style>
    </div>
  );
};
