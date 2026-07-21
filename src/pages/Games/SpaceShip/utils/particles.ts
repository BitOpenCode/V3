// src/pages/Games/SpaceShip/utils/particles.ts

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  alpha: number;
  gravity?: number;
  active: boolean;
}

export interface ParticleSystem {
  particles: Particle[];
  addExplosion: (x: number, y: number, count?: number) => void;
  addEngineTrail: (x: number, y: number, count?: number) => void;
  addPickupEffect: (x: number, y: number, color?: string) => void;
  update: (delta: number) => void;
  draw: (ctx: CanvasRenderingContext2D) => void;
}

export const createParticleSystem = (): ParticleSystem => {
  // ✅ Приватный массив с _ (профессиональное соглашение)
  const _particles: Particle[] = [];
  const MAX_PARTICLES = 30;

  const getParticle = (): Particle => {
    for (let i = 0; i < _particles.length; i++) {
      if (!_particles[i].active) {
        return _particles[i];
      }
    }

    if (_particles.length < MAX_PARTICLES) {
      const p: Particle = {
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        life: 0,
        maxLife: 1,
        size: 0,
        color: '',
        alpha: 0,
        gravity: 0,
        active: false,
      };
      _particles.push(p);
      return p;
    }

    let oldest = 0;
    let oldestLife = Infinity;
    for (let i = 0; i < _particles.length; i++) {
      if (_particles[i].active && _particles[i].life < oldestLife) {
        oldestLife = _particles[i].life;
        oldest = i;
      }
    }
    return _particles[oldest];
  };

  const addExplosion = (x: number, y: number, count: number = 25) => {
    const colors = ['#ff6b6b', '#ffd93d', '#ff9f43', '#ffffff', '#ff4757', '#ff6348'];
    const maxCount = Math.min(count, MAX_PARTICLES);
    for (let i = 0; i < maxCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 5;
      const p = getParticle();
      p.active = true;
      p.x = x + (Math.random() - 0.5) * 15;
      p.y = y + (Math.random() - 0.5) * 15;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed - 1;
      p.life = 1;
      p.maxLife = 0.2 + Math.random() * 0.3;
      p.size = 2 + Math.random() * 4;
      p.color = colors[Math.floor(Math.random() * colors.length)];
      p.alpha = 1;
      p.gravity = 0.08;
    }
  };

  const addEngineTrail = (x: number, y: number, count: number = 1) => {
    const colors = ['#ff6b6b', '#ff9f43', '#ffd93d', '#ffffff'];
    const maxCount = Math.min(count, MAX_PARTICLES);

    for (let i = 0; i < maxCount; i++) {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.5;
      const speed = 0.5 + Math.random() * 1.5;
      const p = getParticle();
      p.active = true;
      p.x = x + (Math.random() - 0.5) * 4;
      p.y = y + (Math.random() - 0.5) * 2;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed + 1;
      p.life = 1;
      p.maxLife = 0.3 + Math.random() * 0.3;
      p.size = 1 + Math.random() * 3;
      p.color = colors[Math.floor(Math.random() * colors.length)];
      p.alpha = 0.8;
      p.gravity = 0.02;
    }
  };

  const addPickupEffect = (x: number, y: number, color: string = '#ffd93d') => {
    const colors = [color, '#ffffff', '#ffd700'];
    const maxCount = Math.min(10, MAX_PARTICLES);

    for (let i = 0; i < maxCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 3;
      const p = getParticle();
      p.active = true;
      p.x = x + (Math.random() - 0.5) * 3;
      p.y = y + (Math.random() - 0.5) * 3;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed - 1.5;
      p.life = 1;
      p.maxLife = 0.1 + Math.random() * 0.15;
      p.size = 1 + Math.random() * 2;
      p.color = colors[Math.floor(Math.random() * colors.length)];
      p.alpha = 1;
      p.gravity = 0.01;
    }
  };

  const update = (delta: number) => {
    for (let i = 0; i < _particles.length; i++) {
      const p = _particles[i];
      if (!p.active) continue;

      p.x += p.vx * delta;
      p.y += p.vy * delta;
      p.vy += (p.gravity || 0) * delta;
      p.life -= delta / p.maxLife;
      p.alpha = Math.max(0, p.life);

      if (p.life <= 0) {
        p.active = false;
      }
    }
  };

  const draw = (ctx: CanvasRenderingContext2D) => {
    for (const p of _particles) {
      if (!p.active) continue;

      ctx.save();

      const glowSize = p.size * p.life * 2.5;
      const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowSize);
      gradient.addColorStop(0, p.color);
      gradient.addColorStop(0.5, p.color + '99');
      gradient.addColorStop(1, 'transparent');

      ctx.globalAlpha = p.alpha * 0.5;
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(p.x, p.y, glowSize, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = p.alpha;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.globalAlpha = p.alpha * 0.8;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life * 0.3, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  };

  return {
    particles: _particles,
    addExplosion,
    addEngineTrail,
    addPickupEffect,
    update,
    draw,
  };
};