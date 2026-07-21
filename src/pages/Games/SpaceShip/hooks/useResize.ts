// src/pages/Games/SpaceShip/hooks/useResize.ts

import { useEffect } from 'react';

interface UseResizeProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
}

export const useResize = ({ canvasRef }: UseResizeProps) => {
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [canvasRef]);
};