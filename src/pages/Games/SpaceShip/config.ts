/**
 * SpaceShip Game Configuration
 * 
 * IMPORTANT: Image URLs are stored here for security reasons.
 * This prevents frontend manipulation of game assets.
 * 
 * For production, consider moving these to environment variables
 * or a secure backend endpoint.
 */

export const GAME_IMAGES = {
  ship: 'https://silver-perfect-barracuda-186.mypinata.cloud/ipfs/bafkreicructrrwqrc35uwcw4gxsqmin7j36kr4e5526itxftviduoncbd4',
  meteor: 'https://silver-perfect-barracuda-186.mypinata.cloud/ipfs/bafkreicz3tpzoa4ivu3vvqeimlxosdmujtnucsepcb6datpdo2dkx2v5mq',
  laser: 'https://silver-perfect-barracuda-186.mypinata.cloud/ipfs/bafkreicsgjm2xzh7c5u65rcy6zaxbxbtzzotyruubabwqhfvxcf6prsiei',
  bonus: 'https://silver-perfect-barracuda-186.mypinata.cloud/ipfs/bafkreifypgmjawffyw4ybii4vz3dpownbms5f35bidwujqvcabfknshima',
  goldBonus: 'https://silver-perfect-barracuda-186.mypinata.cloud/ipfs/bafkreifdzru2ygtpjknpwozh6u4upkanntutsqhtbatw4c7gerk3u7pci4',
  enemyShip: 'https://silver-perfect-barracuda-186.mypinata.cloud/ipfs/bafybeigkchachnmnilbuqxulg3avx3ewfmkfahijmy6mfj3fxam4fn2gwa',
  explosion: 'https://silver-perfect-barracuda-186.mypinata.cloud/ipfs/bafkreiacnhvhf7tg7z32crgyf7n7uosynnpnijpxmyseo6uonft2viutsu',
  healbox: 'https://silver-perfect-barracuda-186.mypinata.cloud/ipfs/bafybeig6hwmewuyvh7ln7rjjz22htfxheoesd24b45hr7yhsjwn7bclcwq',
  redShip: 'https://silver-perfect-barracuda-186.mypinata.cloud/ipfs/bafybeifq65shmzu3wxbwyd4vg562v2hhsablkkxb4fwoith6ln5fii4msq',
  elonShip: 'https://silver-perfect-barracuda-186.mypinata.cloud/ipfs/bafybeieiiqvxctwaj3oilhog3dgs5a2pl6dwh543l5by3qm7idm2kceewq',
} as const;

/**
 * Ship configurations with different sizes
 * Based on original game implementation
 */
export const SHIP_CONFIGS = {
  default: {
    width: 1.0,   // 100% of player.width
    height: 1.0,  // 100% of player.height
    lives: 3,
    level: 1,     // Only Speed 1 available (must be unlocked)
    maxUpgradeSlots: 2,
  },
  redShip: {
    width: 0.65,  // 65% of player.width
    height: 1.8,  // 180% of player.height
    lives: 5,
    level: 2,     // Speeds 1 and 2 available (must be unlocked)
    maxUpgradeSlots: 3,
  },
  elonShip: {
    width: 0.65,  // 65% of player.width
    height: 1.6,  // 160% of player.height
    lives: 7,
    level: 3,     // Speeds 1, 2, 3 available (must be unlocked)
    maxUpgradeSlots: 4,
  },
} as const;

/**
 * Типы улучшений для кораблей
 */
export type UpgradeType = 'weapon' | 'armor' | 'speed' | 'fireRate' | 'shield';

export interface Upgrade {
  id: string;
  type: UpgradeType;
  name: string;
  description: string;
  cost: number;
  icon: string;
}

/**
 * Доступные улучшения в магазине
 */
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
    type: 'speed1',
    name: 'Speed 1',
    description: 'Unlock Speed 1 - Faster gameplay',
    cost: 100,
    icon: '⚡',
  },
  speed2: {
    id: 'speed2',
    type: 'speed2',
    name: 'Speed 2',
    description: 'Unlock Speed 2 - Very fast gameplay (requires level 2+ ship)',
    cost: 200,
    icon: '⚡⚡',
  },
  speed3: {
    id: 'speed3',
    type: 'speed3',
    name: 'Speed 3',
    description: 'Unlock Speed 3 - Maximum speed (requires level 3 ship)',
    cost: 300,
    icon: '⚡⚡⚡',
  },
} as const;

/**
 * Game balance configuration
 * NOTE: For production, these values should be validated on backend
 */
export const GAME_CONFIG = {
  // Currency earning
  currencyPerBonus: 1,        // Currency earned per regular bonus
  currencyPerScore: 1,        // Currency = score at game end (shopCurrency += score)
  
  // Scoring
  scorePerBonus: 10,
  scorePerEnemy: 50,
  
  // Spawn rates
  obstacleSpawnRate: 0.05,
  bonusSpawnRate: 0.03,
  laserBonusSpawnRate: 0.001,
  
  // Speed levels (player controlled)
  speedLevels: {
    1: 2,   // Speed level 1 = base speed 2
    2: 3,   // Speed level 2 = speed 3
    3: 4,   // Speed level 3 = speed 4
    4: 5,   // Speed level 4 = speed 5
  },
  
  // Enemy settings
  enemySpawnDistance: 100,
  enemyShootInterval: 500,
  
  // Healbox settings
  healboxSpawnDistance: 150,
  
  // Upgrade settings
  weaponUpgradeLaserOffset: 15,  // Смещение второго лазера при двойном выстреле
  armorShieldDuration: 5000,      // Длительность щита от брони (5 секунд)
  speedBoostMultiplier: 1.2,      // Множитель скорости при улучшении
  fireRateBoostMultiplier: 0.7,   // Множитель интервала стрельбы (меньше = быстрее)
} as const;
