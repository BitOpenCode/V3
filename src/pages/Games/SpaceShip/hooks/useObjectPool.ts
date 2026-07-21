// src/pages/Games/SpaceShip/hooks/useObjectPool.ts

import { useRef, useCallback } from 'react';
import { Enemy, Obstacle, Bonus, Healbox, Laser, Explosion } from '../types';

type PoolKey = 'enemies' | 'obstacles' | 'bonuses' | 'healboxes' | 'lasers' | 'explosions';

interface Poolable {
  active: boolean;
}

type PoolObject<T> = T & Poolable;

// ✅ Хранилище с конкретными типами
type PoolStore = {
  enemies: PoolObject<Enemy>[];
  obstacles: PoolObject<Obstacle>[];
  bonuses: PoolObject<Bonus>[];
  healboxes: PoolObject<Healbox>[];
  lasers: PoolObject<Laser>[];
  explosions: PoolObject<Explosion>[];
};

export const useObjectPool = () => {
  const poolRef = useRef<PoolStore>({
    enemies: [],
    obstacles: [],
    bonuses: [],
    healboxes: [],
    lasers: [],
    explosions: [],
  });

  const getFromPool = useCallback(<T,>(type: PoolKey): (T & Poolable) | null => {
    // ✅ Приведение через unknown
    const pool = poolRef.current[type] as unknown as (T & Poolable)[];
    
    for (let i = 0; i < pool.length; i++) {
      if (!pool[i].active) {
        pool[i].active = true;
        return pool[i];
      }
    }
    
    if (pool.length < 30) {
      const obj = { active: true } as T & Poolable;
      pool.push(obj);
      return obj;
    }
    
    return null;
  }, []);

  const returnToPool = useCallback(<T,>(type: PoolKey, object: T & Poolable): void => {
    // ✅ Приведение через unknown
    const pool = poolRef.current[type] as unknown as (T & Poolable)[];
    
    if (pool.length >= 30) return;
    
    object.active = false;
    
    // Сбрасываем только если есть такие поля
    if ('x' in object) object.x = 0;
    if ('y' in object) object.y = 0;
    if ('vx' in object) object.vx = 0;
    if ('vy' in object) object.vy = 0;
    if ('rotation' in object) object.rotation = 0;
    if ('hp' in object) object.hp = 1;
    if ('lastShootTime' in object) object.lastShootTime = 0;
    if ('width' in object) object.width = 0;
    if ('height' in object) object.height = 0;
    if ('speed' in object) object.speed = 0;
    
    if (!pool.includes(object)) {
      pool.push(object);
    }
  }, []);

  const clearPool = useCallback(() => {
    Object.keys(poolRef.current).forEach((key) => {
      poolRef.current[key as PoolKey] = [];
    });
  }, []);

  return { getFromPool, returnToPool, clearPool };
};