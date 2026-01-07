import BigNumber from 'bignumber.js';

// Настройка BigNumber для работы с криптовалютами
BigNumber.config({
  DECIMAL_PLACES: 18, // Максимальное количество знаков после запятой
  ROUNDING_MODE: BigNumber.ROUND_DOWN, // Округление вниз для безопасности
  EXPONENTIAL_AT: [-18, 18], // Диапазон экспоненциальной записи
});

/**
 * Создает BigNumber из значения
 */
export const bn = (value: BigNumber.Value): BigNumber => {
  return new BigNumber(value);
};

/**
 * Безопасное деление
 */
export const divide = (a: BigNumber.Value, b: BigNumber.Value): BigNumber => {
  return bn(a).dividedBy(b);
};

/**
 * Безопасное умножение
 */
export const multiply = (a: BigNumber.Value, b: BigNumber.Value): BigNumber => {
  return bn(a).multipliedBy(b);
};

/**
 * Безопасное сложение
 */
export const plus = (a: BigNumber.Value, b: BigNumber.Value): BigNumber => {
  return bn(a).plus(b);
};

/**
 * Безопасное вычитание
 */
export const minus = (a: BigNumber.Value, b: BigNumber.Value): BigNumber => {
  return bn(a).minus(b);
};

/**
 * Форматирует BigNumber в строку с фиксированным количеством знаков
 */
export const toFixed = (value: BigNumber.Value, decimals: number = 2): string => {
  return bn(value).toFixed(decimals, BigNumber.ROUND_DOWN);
};

/**
 * Форматирует BigNumber в строку с автоматическим количеством знаков
 */
export const toFormat = (value: BigNumber.Value, decimals: number = 8): string => {
  const num = bn(value);
  if (num.isZero()) return '0';
  
  // Убираем лишние нули в конце
  return num.toFixed(decimals).replace(/\.?0+$/, '');
};

/**
 * Вычисляет процент изменения
 */
export const calculatePercentChange = (
  oldValue: BigNumber.Value,
  newValue: BigNumber.Value
): BigNumber => {
  const old = bn(oldValue);
  if (old.isZero()) return bn(0);
  
  return bn(newValue).minus(old).dividedBy(old).multipliedBy(100);
};

/**
 * Вычисляет прибыль/убыток
 */
export const calculateProfit = (
  cost: BigNumber.Value,
  value: BigNumber.Value
): BigNumber => {
  return bn(value).minus(cost);
};

/**
 * Вычисляет процент прибыли/убытка
 */
export const calculateProfitPercent = (
  cost: BigNumber.Value,
  value: BigNumber.Value
): BigNumber => {
  const costBn = bn(cost);
  if (costBn.isZero()) return bn(0);
  
  return calculateProfit(cost, value).dividedBy(costBn).multipliedBy(100);
};

export default BigNumber;

