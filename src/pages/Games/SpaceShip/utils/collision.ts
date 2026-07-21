// src/pages/Games/SpaceShip/utils/collision.ts

/**
 * Прямоугольник на прямоугольник (по координатам)
 */
export const rectCollision = (
  ax: number, ay: number, aw: number, ah: number,
  bx: number, by: number, bw: number, bh: number
): boolean => {
  return ax < bx + bw &&
         ax + aw > bx &&
         ay < by + bh &&
         ay + ah > by;
};

/**
 * Прямоугольник на прямоугольник (по объектам)
 * Используется в usePhysics
 */
export const rectCollisionObjects = (
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number }
): boolean => {
  return rectCollision(
    a.x, a.y, a.width, a.height,
    b.x, b.y, b.width, b.height
  );
};

/**
 * Точка в прямоугольнике
 */
export const pointInRect = (
  px: number, py: number,
  rx: number, ry: number, rw: number, rh: number
): boolean => {
  return px >= rx && px <= rx + rw &&
         py >= ry && py <= ry + rh;
};

/**
 * Точка в прямоугольнике (по объекту)
 */
export const pointInRectObject = (
  px: number, py: number,
  rect: { x: number; y: number; width: number; height: number }
): boolean => {
  return pointInRect(px, py, rect.x, rect.y, rect.width, rect.height);
};

/**
 * Круг в прямоугольник
 */
export const circleRectCollision = (
  cx: number, cy: number, radius: number,
  rx: number, ry: number, rw: number, rh: number
): boolean => {
  const closestX = Math.max(rx, Math.min(cx, rx + rw));
  const closestY = Math.max(ry, Math.min(cy, ry + rh));
  const dx = cx - closestX;
  const dy = cy - closestY;
  return (dx * dx + dy * dy) < (radius * radius);
};

/**
 * Круг в прямоугольник (по объектам)
 */
export const circleRectCollisionObjects = (
  circle: { x: number; y: number; radius: number },
  rect: { x: number; y: number; width: number; height: number }
): boolean => {
  return circleRectCollision(
    circle.x, circle.y, circle.radius,
    rect.x, rect.y, rect.width, rect.height
  );
};

/**
 * Два круга
 */
export const circleCollision = (
  ax: number, ay: number, aRadius: number,
  bx: number, by: number, bRadius: number
): boolean => {
  const dx = ax - bx;
  const dy = ay - by;
  const dist = Math.sqrt(dx * dx + dy * dy);
  return dist < aRadius + bRadius;
};

/**
 * Два круга (по объектам)
 */
export const circleCollisionObjects = (
  a: { x: number; y: number; radius: number },
  b: { x: number; y: number; radius: number }
): boolean => {
  return circleCollision(a.x, a.y, a.radius, b.x, b.y, b.radius);
};

/**
 * Расстояние между двумя точками
 */
export const distance = (
  ax: number, ay: number,
  bx: number, by: number
): number => {
  const dx = ax - bx;
  const dy = ay - by;
  return Math.sqrt(dx * dx + dy * dy);
};

/**
 * Расстояние между двумя объектами
 */
export const distanceObjects = (
  a: { x: number; y: number },
  b: { x: number; y: number }
): number => {
  return distance(a.x, a.y, b.x, b.y);
};