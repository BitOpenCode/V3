import React, { useEffect, useRef } from 'react';

const MATRIX_SYMBOL = '₿';

type Drop = {
  y: number;
  speed: number;
  length: number;
  chars: number[];
  lastUpdate: number;
  brightness: number;
  glowIntensity: number;
  changeRate: number;
};

type Palette = {
  primary: string;
  highlight: string;
  fade: string;
  background: string;
  glowStrength: number;
  secondaryColors: string[];
};

const MatrixLoader: React.FC<{ visible?: boolean }> = ({ visible = true }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const dropsRef = useRef<Drop[]>([]);
  const paletteRef = useRef<Palette | null>(null);

  useEffect(() => {
    if (!visible) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    function resizeCanvas() {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const chars = MATRIX_SYMBOL;
    const fontSize = 14;
    const columns = Math.floor((canvas?.width || window.innerWidth) / fontSize);

    const palette: Palette = {
      primary: '#00FF41',
      highlight: '#FFFFFF',
      fade: 'rgba(0, 15, 2, 0.18)',
      background: 'rgba(0, 0, 0, 0.9)',
      glowStrength: 15,
      secondaryColors: ['#4AFF41', '#2AFF81', '#00FF00']
    };
    paletteRef.current = palette;

    const drops: Drop[] = Array.from({ length: columns }, () => ({
      y: Math.random() * (canvas?.height || window.innerHeight),
      speed: 2 + Math.random() * 3,
      length: 20 + Math.floor(Math.random() * 15),
      chars: Array.from({ length: 35 }, () => 0),
      lastUpdate: performance.now(),
      brightness: 0.7 + Math.random() * 0.3,
      glowIntensity: 0.9 + Math.random() * 0.3,
      changeRate: 2 + Math.random() * 3
    }));
    dropsRef.current = drops;

    let lastTime = 0;
    const FPS = 60;
    const frameTime = 1000 / FPS;

    function draw(timestamp: number) {
      if (!ctx) return;
      if (timestamp - lastTime < frameTime) {
        animationRef.current = requestAnimationFrame(draw);
        return;
      }
      lastTime = timestamp;

      ctx.fillStyle = palette.fade;
      ctx.fillRect(0, 0, canvas?.width || window.innerWidth, canvas?.height || window.innerHeight);

      drops.forEach((drop, i) => {
        drop.y += drop.speed * (1 + Math.random() * 0.2);
        if (timestamp - drop.lastUpdate > 1000 / drop.changeRate) {
          drop.chars = [...drop.chars.slice(1), 0];
          drop.lastUpdate = timestamp;
        }
        drop.chars.forEach((charIndex: number, j: number) => {
          const char = chars[charIndex];
          const y = drop.y - j * fontSize;
          if (y < -fontSize || y > (canvas?.height || window.innerHeight) + fontSize) return;
          const alpha = Math.pow(1 - j / drop.length, 1.5);
          ctx.fillStyle = j === 0 ? palette.highlight : `rgba(0, 255, 65, ${alpha * drop.brightness})`;
          ctx.shadowColor = palette.primary;
          ctx.shadowBlur = j === 0 ? palette.glowStrength * drop.glowIntensity : 0;
          if (Math.random() < 0.002) {
            ctx.fillStyle = palette.highlight;
            ctx.shadowBlur = palette.glowStrength * 2;
          }
          const fontSize2 = fontSize * (j === 0 ? 1.2 : 1);
          ctx.font = `bold ${fontSize2}px monospace`;
          const xPos = i * fontSize + (Math.random() < 0.05 ? Math.random() * 2 - 1 : 0);
          ctx.fillText(char, xPos, y);
        });
        if (drop.y - drop.length * fontSize > (canvas?.height || window.innerHeight)) {
          drop.y = -drop.length * fontSize * Math.random();
          drop.speed = 2 + Math.random() * 3;
          drop.length = 20 + Math.floor(Math.random() * 15);
          drop.brightness = 0.7 + Math.random() * 0.3;
          drop.changeRate = 2 + Math.random() * 3;
        }
      });
      ctx.shadowBlur = 0;
      animationRef.current = requestAnimationFrame(draw);
    }

    drops.forEach(drop => {
      drop.y = Math.random() * (canvas?.height || window.innerHeight);
    });

    animationRef.current = requestAnimationFrame(draw);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [visible]);

  if (!visible) return null;
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: '#000',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <canvas ref={canvasRef} style={{ width: '100vw', height: '100vh', display: 'block' }} />
    </div>
  );
};

export default MatrixLoader; 