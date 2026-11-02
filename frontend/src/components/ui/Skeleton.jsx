import React from 'react';

export default function Skeleton({ label = 'Loading content', lines = 3 }) {
  return <div className="fb-skeleton" role="status"><span className="fb-sr-only">{label}</span>{Array.from({ length: lines }, (_, index) => <span className="fb-skeleton-line" aria-hidden="true" key={index} />)}</div>;
}
