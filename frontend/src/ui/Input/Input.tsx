import React, { useState } from 'react';
import classNames from 'classnames';
import styles from './Input.module.scss';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  hint?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      hint,
      icon,
      iconPosition = 'left',
      fullWidth = false,
      className,
      id,
      onFocus,
      onBlur,
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const hasError = !!error;
    const [showHint, setShowHint] = useState(false);

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      if (hint) setShowHint(true);
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setTimeout(() => setShowHint(false), 200);
      onBlur?.(e);
    };

    return (
      <div className={classNames(
        styles.wrapper,
        {
          [styles.fullWidth]: fullWidth,
        },
        className
      )}>
        {label && (
          <label htmlFor={inputId} className={styles.label}>
            {label}
            {props.required && <span className={styles.required}>*</span>}
          </label>
        )}
        <div className={styles.inputWrapper}>
          {icon && iconPosition === 'left' && (
            <span className={styles.iconContainer}>{icon}</span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={classNames(
              styles.input,
              {
                [styles.error]: hasError,
                [styles.withIcon]: !!icon,
                [styles.iconLeft]: icon && iconPosition === 'left',
                [styles.iconRight]: icon && iconPosition === 'right',
              }
            )}
            onFocus={handleFocus}
            onBlur={handleBlur}
            {...props}
          />
          {icon && iconPosition === 'right' && (
            <span className={styles.iconContainer}>{icon}</span>
          )}
          {showHint && hint && (
            <div className={styles.hint}>
              {hint}
            </div>
          )}
        </div>
        {(error || helperText) && (
          <div className={classNames({
            [styles.errorText]: hasError,
            [styles.helperText]: !hasError,
          })}>
            {error || helperText}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

