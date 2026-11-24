import React from 'react';

export default function AnimatedCounter({ value = 0, decimals = 0, prefix = '', suffix = '', className = '' }) {
  const number = Number(value);
  return <span className={className}>{prefix}{Number.isFinite(number) ? number.toLocaleString(undefined, {minimumFractionDigits: decimals, maximumFractionDigits: decimals}) : '—'}{suffix}</span>;
}
