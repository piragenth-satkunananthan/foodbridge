import React, { forwardRef, useId } from 'react';

const Field = forwardRef(function Field({ id, label, hint, error, as: Control = 'input', className = '', children, ...props }, ref) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const description = [props['aria-describedby'], hint && `${inputId}-hint`, error && `${inputId}-error`].filter(Boolean).join(' ') || undefined;
  return (
    <div className={`fb-field ${className}`}>
      <label htmlFor={inputId}>{label}{props.required && <span aria-hidden="true"> *</span>}</label>
      {hint && <p className="fb-field-hint" id={`${inputId}-hint`}>{hint}</p>}
      <Control ref={ref} {...props} id={inputId} className="fb-input" aria-invalid={error ? true : undefined} aria-describedby={description}>{children}</Control>
      {error && <p className="fb-field-error" id={`${inputId}-error`} role="alert">{error}</p>}
    </div>
  );
});
export default Field;
