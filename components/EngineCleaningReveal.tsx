import React, { useEffect, useRef } from 'react';
import styles from './EngineCleaningReveal.module.css';

type EngineCleaningRevealProps = {
  beforeSrc?: string;
  afterSrc?: string;
  className?: string;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export default function EngineCleaningReveal({
  beforeSrc = '/assets/images/image1.png',
  afterSrc = '/assets/images/image2.png',
  className = '',
}: EngineCleaningRevealProps) {
  const revealRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const targetRef = useRef({ x: 50, y: 50, radius: 140 });
  const currentRef = useRef({ x: 50, y: 50, radius: 140 });
  const rafRef = useRef<number | null>(null);

  const getRevealRadius = () => {
    if (!revealRef.current) return 140;
    return clamp(Math.round(revealRef.current.offsetWidth * 0.18), 120, 180);
  };

  useEffect(() => {
    const reveal = revealRef.current;
    const frame = frameRef.current;
    if (!reveal || !frame) return undefined;

    const updateFrame = () => {
      currentRef.current.x +=
        (targetRef.current.x - currentRef.current.x) * 0.18;
      currentRef.current.y +=
        (targetRef.current.y - currentRef.current.y) * 0.18;
      currentRef.current.radius +=
        (targetRef.current.radius - currentRef.current.radius) * 0.18;

      frame.style.setProperty('--reveal-x', `${currentRef.current.x}%`);
      frame.style.setProperty('--reveal-y', `${currentRef.current.y}%`);
      frame.style.setProperty(
        '--reveal-radius',
        `${currentRef.current.radius}px`,
      );

      rafRef.current = requestAnimationFrame(updateFrame);
    };

    const setRevealPosition = (clientX: number, clientY: number) => {
      const rect = reveal.getBoundingClientRect();
      const x = clamp(((clientX - rect.left) / rect.width) * 100, 0, 100);
      const y = clamp(((clientY - rect.top) / rect.height) * 100, 0, 100);

      targetRef.current.x = x;
      targetRef.current.y = y;
      targetRef.current.radius = getRevealRadius();
    };

    const pointerMove = (event: MouseEvent | TouchEvent) => {
      const point = event instanceof TouchEvent ? event.touches[0] : event;
      if (!point) return;
      setRevealPosition(point.clientX, point.clientY);
    };

    const hideReveal = () => {
      targetRef.current.radius = 0;
    };

    const onResize = () => {
      targetRef.current.radius = getRevealRadius();
    };

    reveal.addEventListener('mousemove', pointerMove);
    reveal.addEventListener('touchstart', pointerMove, { passive: true });
    reveal.addEventListener('touchmove', pointerMove, { passive: true });
    reveal.addEventListener('mouseleave', hideReveal);
    reveal.addEventListener('touchend', hideReveal);
    reveal.addEventListener('touchcancel', hideReveal);
    window.addEventListener('resize', onResize);

    rafRef.current = requestAnimationFrame(updateFrame);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      reveal.removeEventListener('mousemove', pointerMove);
      reveal.removeEventListener('touchstart', pointerMove);
      reveal.removeEventListener('touchmove', pointerMove);
      reveal.removeEventListener('mouseleave', hideReveal);
      reveal.removeEventListener('touchend', hideReveal);
      reveal.removeEventListener('touchcancel', hideReveal);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <div
      className={`${styles.engineCleaningReveal} ${className}`.trim()}
      ref={revealRef}
    >
      <div className={styles.engineCleaningFrame} ref={frameRef}>
        <img
          src={beforeSrc}
          alt="Before engine cleaning"
          className={styles.engineImage}
        />
        <img
          src={afterSrc}
          alt="After engine cleaning"
          className={`${styles.engineImage} ${styles.engineAfter}`}
        />
        <div className={styles.engineLabel + ' ' + styles.engineLabelBefore}>
          BEFORE
        </div>
        <div className={styles.engineLabel + ' ' + styles.engineLabelAfter}>
          AFTER
        </div>
        <div className={styles.engineHalo} />
      </div>
      <div className={styles.engineCopy}>
        <span className={styles.engineCopyTag}>
          Interactive Cleaning Reveal
        </span>
        <p className={styles.engineCopyText}>
          Drag or move over the engine to simulate premium degreaser action and
          reveal the clean surface beneath.
        </p>
      </div>
    </div>
  );
}
