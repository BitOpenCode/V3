// src/pages/Games/SpaceShip/types.ts

export interface Player {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  dx: number;
  dy: number;
}

export interface Enemy {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  dx: number;
  dy: number;
  lastShootTime: number;
  active: boolean; // ← ОБЯЗАТЕЛЬНЫЙ
  vx?: number;
  vy?: number;
  hp?: number;
  isBoss?: boolean;
}

export interface Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  rotation: number;
  active: boolean; // ← ОБЯЗАТЕЛЬНЫЙ
  vx?: number;
  vy?: number;
  hp?: number;
  lastShootTime?: number;
}

export interface Bonus {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  type: 'regular' | 'laser';
  active: boolean; // ← ОБЯЗАТЕЛЬНЫЙ
  vx?: number;
  vy?: number;
  hp?: number;
  lastShootTime?: number;
}

export interface Laser {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  isEnemy?: boolean;
  active: boolean; // ← ОБЯЗАТЕЛЬНЫЙ
  vx?: number;
  vy?: number;
  hp?: number;
  lastShootTime?: number;
}

export interface Explosion {
  x: number;
  y: number;
  width: number;
  height: number;
  alpha: number;
  startTime: number;
  duration: number;
  active?: boolean;
  vx?: number;
  vy?: number;
  hp?: number;
  lastShootTime?: number;
}

export interface PlayerExplosion {
  x: number;
  y: number;
  width: number;
  height: number;
  alpha: number;
  blinkInterval: number;
  lastBlinkTime: number;
  duration: number;
  startTime: number;
}

export interface Star {
  x: number;
  y: number;
  size: number;
  speed: number;
}

export interface Healbox {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  active: boolean; // ← ОБЯЗАТЕЛЬНЫЙ
  vx?: number;
  vy?: number;
  hp?: number;
  lastShootTime?: number;
}

export interface GameData {
  gameRunning: boolean;
  score: number;
  lives: number;
  distance: number;
  shopCurrency: number;
  speed: number;
  speedLevel: number;
  enemiesDestroyed: number;
  isPlayerVisible: boolean;
  player: Player;
  enemies: Enemy[];
  obstacles: Obstacle[];
  bonuses: Bonus[];
  lasers: Laser[];
  explosions: Explosion[];
  healboxes: Healbox[];
  stars: Star[];
  playerExplosion: PlayerExplosion | null;
  hasShield: boolean;
  shieldStartTime: number | null;
  lastEnemySpawnDistance: number;
  lastHealboxSpawnDistance: number;
  enemyShootInterval: number;
  laserShotsCount: number;
  totalLaserShots: number;
  laserShootInterval: number;
  touchX: number | null;
  touchY: number | null;
}

export interface GameState {
  score: number;
  lives: number;
  distance: number;
  enemiesDestroyed: number;
  highScore: number;
  shopCurrency: number;
}

export type GameScreen = 'menu' | 'playing' | 'gameover' | 'shop' | 'inventory';

export interface ShipUpgrades {
  [shipType: string]: string[];
}