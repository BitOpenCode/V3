// src/pages/Games/SpaceShip/config.ts

import shipImg from '../../../assets/images/games/spaceship/ship.png';
import meteorImg from '../../../assets/images/games/spaceship/meteor.png';
import laserImg from '../../../assets/images/games/spaceship/laser.png';
import bonusImg from '../../../assets/images/games/spaceship/bonus.png';
import goldBonusImg from '../../../assets/images/games/spaceship/goldBonus.png';
import enemyShipImg from '../../../assets/images/games/spaceship/enemyShip.png';
import explosionImg from '../../../assets/images/games/spaceship/explosion.png';
import healboxImg from '../../../assets/images/games/spaceship/healbox.png';
import redShipImg from '../../../assets/images/games/spaceship/redShip.png';
import elonShipImg from '../../../assets/images/games/spaceship/elonShip.png';

export const GAME_IMAGES = {
  ship: shipImg,
  meteor: meteorImg,
  laser: laserImg,
  bonus: bonusImg,
  goldBonus: goldBonusImg,
  enemyShip: enemyShipImg,
  explosion: explosionImg,
  healbox: healboxImg,
  redShip: redShipImg,
  elonShip: elonShipImg,
} as const;

export const SHIP_CONFIGS = {
  default: {
    width: 1.0,
    height: 1.0,
    lives: 3,
    level: 1,
    maxUpgradeSlots: 2,
  },
  redShip: {
    width: 0.7,
    height: 1.4,
    lives: 5,
    level: 2,
    maxUpgradeSlots: 3,
  },
  elonShip: {
    width: 0.7,
    height: 1.4,
    lives: 7,
    level: 3,
    maxUpgradeSlots: 4,
  },
} as const;

// ✅ ИСПРАВЛЕННЫЙ ТИП - теперь включает все апгрейды
export type UpgradeType = 
  | 'weapon' 
  | 'armor' 
  | 'speed' 
  | 'fireRate' 
  | 'shield'
  | 'speed1'
  | 'speed2'
  | 'speed3';

export interface Upgrade {
  id: string;
  type: UpgradeType;
  name: string;
  description: string;
  cost: number;
  icon: string;
}

export const UPGRADES: Record<string, Upgrade> = {
  weapon: {
    id: 'weapon',
    type: 'weapon',
    name: 'Double Shot',
    description: 'Ship fires 2 lasers simultaneously',
    cost: 150,
    icon: '⚔️',
  },
  armor: {
    id: 'armor',
    type: 'armor',
    name: 'Armor',
    description: 'Creates shield around ship, blocks 1 hit',
    cost: 200,
    icon: '🛡️',
  },
  fireRate: {
    id: 'fireRate',
    type: 'fireRate',
    name: 'Rapid Fire',
    description: 'Increases fire rate by 30%',
    cost: 120,
    icon: '🔥',
  },
  shield: {
    id: 'shield',
    type: 'shield',
    name: 'Energy Shield',
    description: 'Additional shield, blocks 1 hit (can combine with armor)',
    cost: 180,
    icon: '💎',
  },
  speed1: {
    id: 'speed1',
    type: 'speed1', // ← ТЕПЕРЬ 'speed1' входит в UpgradeType
    name: 'Speed 1',
    description: 'Unlock Speed 1 - Faster gameplay',
    cost: 100,
    icon: '⚡',
  },
  speed2: {
    id: 'speed2',
    type: 'speed2', // ← ТЕПЕРЬ 'speed2' входит в UpgradeType
    name: 'Speed 2',
    description: 'Unlock Speed 2 - Very fast gameplay (requires level 2+ ship)',
    cost: 200,
    icon: '⚡⚡',
  },
  speed3: {
    id: 'speed3',
    type: 'speed3', // ← ТЕПЕРЬ 'speed3' входит в UpgradeType
    name: 'Speed 3',
    description: 'Unlock Speed 3 - Maximum speed (requires level 3 ship)',
    cost: 300,
    icon: '⚡⚡⚡',
  },
} as const;

export const GAME_CONFIG = {
  maxEnemies: 6,
  maxObstacles: 30,
  maxBonuses: 10,
  maxHealboxes: 4,
  maxLasers: 30,
  maxParticles: 70,
  
  currencyPerBonus: 1,
  currencyPerScore: 1,
  scorePerBonus: 10,
  scorePerEnemy: 50,
  obstacleSpawnRate: 0.05,
  bonusSpawnRate: 0.03,
  laserBonusSpawnRate: 0.001,
  speedLevels: {
    1: 2,
    2: 3,
    3: 4,
    4: 5,
  },
  enemySpawnDistance: 100,
  enemyShootInterval: 500,
  healboxSpawnDistance: 150,
  weaponUpgradeLaserOffset: 15,
  armorShieldDuration: 5000,
  speedBoostMultiplier: 1.2,
  fireRateBoostMultiplier: 0.7,
} as const;