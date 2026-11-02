import React from 'react';

export default function EmptyState({ title, description, action }) {
  return <div className="fb-empty"><h3>{title}</h3><p>{description}</p>{action}</div>;
}
