import React from 'react';

const statuses = {
  posted: ['Available', 'success'], matched: ['Matched', 'neutral'], claimed: ['Claimed', 'warning'],
  pickup_scheduled: ['Pickup scheduled', 'warning'], picked_up: ['Collected', 'success'],
  delivered: ['Delivered', 'success'], completed: ['Completed', 'success'], recycled: ['Recycled', 'success'],
  pending: ['Awaiting review', 'warning'], verified: ['Approved', 'success'],
  rejected: ['Rejected', 'danger'], cancelled: ['Cancelled', 'neutral'], expired: ['Expired', 'neutral']
};
export default function StatusBadge({ status, label }) {
  const [text, tone] = statuses[status] || [String(status || 'Unknown').replace(/_/g, ' '), 'neutral'];
  return <span className={`fb-badge fb-badge--${tone}`}>{label || text}</span>;
}
