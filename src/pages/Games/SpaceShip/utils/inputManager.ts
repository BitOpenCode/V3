// src/pages/Games/SpaceShip/utils/inputManager.ts

export class InputManager {
  private keys: { [key: string]: boolean } = {};
  private touchX: number | null = null;
  private touchY: number | null = null;

  constructor() {
    // Клавиатура
    window.addEventListener('keydown', (e) => {
      this.keys[e.key] = true;
    });
    window.addEventListener('keyup', (e) => {
      this.keys[e.key] = false;
    });
  }

  getKey(key: string): boolean {
    return this.keys[key] || false;
  }

  getKeys(): { [key: string]: boolean } {
    return this.keys;
  }

  getTouchPosition(): { x: number | null; y: number | null } {
    return { x: this.touchX, y: this.touchY };
  }

  setTouchPosition(x: number | null, y: number | null) {
    this.touchX = x;
    this.touchY = y;
  }

  isAnyKeyPressed(): boolean {
    return Object.values(this.keys).some(v => v === true);
  }

  clear() {
    this.keys = {};
    this.touchX = null;
    this.touchY = null;
  }
}