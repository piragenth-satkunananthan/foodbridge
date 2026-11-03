const aliases = {
  kg: ['kg', 'kgs', 'kilogram', 'kilograms', 'kilo', 'kilos'],
  g: ['g', 'gram', 'grams'],
  tonne: ['t', 'ton', 'tons', 'tonne', 'tonnes'],
  portion: ['plate', 'plates', 'meal', 'meals', 'portion', 'portions', 'packet', 'packets', 'box', 'boxes']
};
function parseQuantity(value) {
  if (typeof value !== 'string') return null;
  const match = value.trim().toLowerCase().match(/^(\d+(?:\.\d+)?|\.\d+)\s+([a-z]+)(?:\s+.*)?$/);
  if (!match) return null;
  const amount = Number(match[1]);
  const unit = Object.keys(aliases).find((key) => aliases[key].includes(match[2]));
  if (!unit || !Number.isFinite(amount) || amount <= 0 || amount > 1e9) return null;
  const kg = unit === 'portion' ? amount * 0.4 : amount * ({ kg: 1, g: 0.001, tonne: 1000 }[unit]);
  return { amount, unit, kg, meals: unit === 'portion' ? Math.round(amount) : Math.round(kg * 2.5), estimatedWeight: unit === 'portion' };
}
const parseMealsCount = (value) => parseQuantity(value)?.meals || 0;
const parseWeightKg = (value) => { const q = parseQuantity(value); return q && !q.estimatedWeight ? q.kg : 0; };
module.exports = { parseQuantity, parseMealsCount, parseWeightKg };
