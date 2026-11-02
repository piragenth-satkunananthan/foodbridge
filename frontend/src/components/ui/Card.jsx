import React from 'react';

export default function Card({ as: Element = 'div', className = '', children, ...props }) {
  return <Element className={`fb-card ${className}`} {...props}>{children}</Element>;
}
