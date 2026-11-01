// Only explicitly supported units contribute to reported impact.
function parseQuantity(value) {
  if (typeof value !== 'string') return null;
  const match = value.trim().toLowerCase().match(/^(\d+(?:\.\d+)?|\.\d+)\s+([a-z]+)(?:\s+.*)?$/);
  if (!match) return null;
  const amount = Number(match[1]);
  return Number.isFinite(amount) && amount > 0 ? { amount, unit: match[2] } : null;
}

function parseWeightKg(value) {
  const quantity = parseQuantity(value);
  if (!quantity) return 0;
  const { amount, unit } = quantity;
  if (['kg', 'kgs', 'kilogram', 'kilograms', 'kilo', 'kilos'].includes(unit)) return amount;
  if (['g', 'gram', 'grams'].includes(unit)) return amount / 1000;
  if (['t', 'ton', 'tons', 'tonne', 'tonnes'].includes(unit)) return amount * 1000;
  return 0;
}

function parseMealsCount(value) {
  const quantity = parseQuantity(value);
  if (!quantity) return 0;
  if (['plate', 'plates', 'meal', 'meals', 'portion', 'portions', 'packet', 'packets', 'box', 'boxes'].includes(quantity.unit)) {
    return Math.round(quantity.amount);
  }
  return Math.round(parseWeightKg(value) * 2.5);
}

module.exports = { parseMealsCount, parseWeightKg };
