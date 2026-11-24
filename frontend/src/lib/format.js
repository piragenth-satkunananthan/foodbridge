// Mirrors backend/utils/distanceUtils.js DISTRICT_COORDINATES keys (the API validates).
export const DISTRICTS = [
  'Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Matale', 'Nuwara Eliya', 'Galle', 'Matara',
  'Hambantota', 'Jaffna', 'Kilinochchi', 'Mannar', 'Vavuniya', 'Mullaitivu', 'Batticaloa',
  'Ampara', 'Trincomalee', 'Kurunegala', 'Puttalam', 'Anuradhapura', 'Polonnaruwa', 'Badulla',
  'Monaragala', 'Ratnapura', 'Kegalle'
];

export const ROLE_HOME = { donor: '/donor', recipient: '/recipient', volunteer: '/volunteer', recycler: '/recycler', admin: '/admin' };
export const ROLE_LABEL = { donor: 'Donor', recipient: 'Recipient organisation', volunteer: 'Volunteer', recycler: 'Recycler / collector', admin: 'Administrator' };

export const WASTE_LABEL = { plastic: 'Plastic', glass: 'Glass', paper: 'Paper & cardboard', metal: 'Metal', organic: 'Organic', non_recyclable: 'Non-recyclable' };
export const STORAGE_LABEL = { refrigerated: 'Refrigerated', room_temperature: 'Room temperature', frozen: 'Frozen' };
export const ORG_TYPE_LABEL = { ngo: 'NGO', charity: 'Charity', shelter: 'Shelter', recycler: 'Recycler', composting_facility: 'Composting facility', waste_management: 'Waste management' };

const STATUS = {
  posted: ['Open', 'info'],
  matched: ['Claimed', 'warning'],
  pickup_scheduled: ['Volunteer assigned', 'warning'],
  picked_up: ['In transit', 'info'],
  delivered: ['Arrived', 'info'],
  delivered_or_recycled: ['Arrived', 'info'],
  completed: ['Completed', 'success'],
  recycled: ['Recycled', 'success'],
  composted: ['Composted', 'success'],
  disposed: ['Disposed', 'neutral'],
  cancelled: ['Cancelled', 'neutral'],
  expired: ['Expired', 'danger'],
  rejected: ['Rejected', 'danger'],
  pending: ['Pending review', 'warning'],
  verified: ['Verified', 'success'],
  active: ['Active', 'success'],
  suspended: ['Suspended', 'danger'],
  open: ['Open', 'warning'],
  investigating: ['Investigating', 'info'],
  resolved: ['Resolved', 'success'],
  dismissed: ['Dismissed', 'neutral']
};
export const statusInfo = (s) => STATUS[s] || [String(s || 'Unknown').replaceAll('_', ' '), 'neutral'];

export const PIPELINE = [
  ['matched', 'Claimed'],
  ['pickup_scheduled', 'Assigned'],
  ['picked_up', 'Collected'],
  ['delivered_or_recycled', 'Arrived'],
  ['completed', 'Confirmed']
];

const dtf = new Intl.DateTimeFormat('en-LK', { dateStyle: 'medium', timeStyle: 'short' });
export const fmtDate = (v) => (v ? dtf.format(new Date(v)) : '—');
export const fmtNum = (n, digits = 0) => (Number.isFinite(Number(n)) ? Number(n).toLocaleString('en-LK', { maximumFractionDigits: digits }) : '—');

export function timeLeft(deadline) {
  const ms = new Date(deadline) - Date.now();
  if (!Number.isFinite(ms)) return '—';
  if (ms <= 0) return 'Deadline passed';
  const h = Math.floor(ms / 3600000);
  if (h >= 24) return `${Math.floor(h / 24)}d ${h % 24}h left`;
  if (h >= 1) return `${h}h ${Math.floor((ms % 3600000) / 60000)}m left`;
  return `${Math.max(1, Math.floor(ms / 60000))}m left`;
}
export const isUrgent = (deadline) => new Date(deadline) - Date.now() < 3 * 3600000;

// datetime-local <-> ISO in the viewer's timezone
export const toLocalInput = (v) => {
  if (!v) return '';
  const d = new Date(v);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};
export const fromLocalInput = (v) => (v ? new Date(v).toISOString() : undefined);

export const initials = (name = '') => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('') || '?';

// OpenStreetMap directions; coordinates when known, otherwise district names.
export function routeUrl(from, to) {
  const point = (p) => (p?.coords?.lat != null ? `${p.coords.lat},${p.coords.lng}` : `${p?.district || ''}, Sri Lanka`);
  return `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${encodeURIComponent(point(from))};${encodeURIComponent(point(to))}`;
}
