import React, { forwardRef } from 'react';
import { Link } from 'react-router-dom';

const Button = forwardRef(function Button({ to, variant = 'primary', className = '', children, disabled, type = 'button', ...props }, ref) {
  const classes = `fb-button fb-button--${variant} ${className}`;
  if (to && !disabled) return <Link ref={ref} to={to} className={classes} {...props}>{children}</Link>;
  return <button ref={ref} type={type} className={classes} disabled={disabled} {...props}>{children}</button>;
});
export default Button;
