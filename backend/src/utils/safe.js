export const safeDiv = (a, b) => {
  const numerator = Number(a || 0);
  const denominator = Number(b || 0);
  return denominator === 0 ? 0 : numerator / denominator;
};

export const toDecimal = (value, precision = 2) => Number(Number(value || 0).toFixed(precision));
