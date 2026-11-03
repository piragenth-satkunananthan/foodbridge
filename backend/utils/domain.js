const { DISTRICT_COORDINATES } = require('./distanceUtils');

class DomainError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
const fail = (status, message) => {
  throw new DomainError(status, message);
};
const sameId = (a, b) =>
  Boolean(a && b && String(a._id || a) === String(b._id || b));
const endpoint = (handler) => async (req, res, next) => {
  try {
    await handler(req, res);
  } catch (error) {
    next(error);
  }
};
function district(value) {
  if (typeof value !== 'string') fail(400, 'District is required');
  const found = Object.keys(DISTRICT_COORDINATES).find(
    (name) => name.toLowerCase() === value.trim().toLowerCase()
  );
  if (!found) fail(400, 'Unknown district');
  return found;
}
function text(value, name, max = 2000) {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > max)
    fail(400, `${name} must be non-empty text (maximum ${max} characters)`);
  return value.trim();
}
function coordinates(value) {
  if (value === null) return null;
  if (
    !value ||
    typeof value.lat !== 'number' ||
    typeof value.lng !== 'number' ||
    !Number.isFinite(value.lat) ||
    !Number.isFinite(value.lng) ||
    Math.abs(value.lat) > 90 ||
    Math.abs(value.lng) > 180
  )
    fail(400, 'Valid numeric latitude and longitude are required');
  return { lat: value.lat, lng: value.lng };
}
function pagination(query) {
  const page = Number(query.page || 1),
    limit = Number(query.limit || 50);
  if (
    !Number.isInteger(page) ||
    page < 1 ||
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > 100
  )
    fail(400, 'Invalid pagination (limit must be 1-100)');
  return { page, limit, skip: (page - 1) * limit };
}
function literalRegex(value) {
  return text(value, 'Search', 100).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
module.exports = {
  DomainError,
  fail,
  sameId,
  endpoint,
  district,
  text,
  coordinates,
  pagination,
  literalRegex
};
