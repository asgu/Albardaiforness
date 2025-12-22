'use client';

import { useState, forwardRef, InputHTMLAttributes } from 'react';
import classNames from 'classnames';
import styles from './InputWithHint.module.scss';

interface InputWithHintProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  hint?: string;
  fullWidth?: boolean;
}

const InputWithHint = forwardRef<HTMLInputElement, InputWithHintProps>(
  ({ label, error, hint, fullWidth, className, ...props }, ref) => {
    const [showHint, setShowHint] = useState(false);

    return (
      <div className={classNames(styles.wrapper, { [styles.fullWidth]: fullWidth })}>
        {label && (
          <label className={styles.label}>
            {label}
            {props.required && <span className={styles.required}>*</span>}
          </label>
        )}
        <div className={styles.inputWrapper}>
          <input
            ref={ref}
            className={classNames(styles.input, className, {
              [styles.error]: error,
            })}
            onFocus={(e) => {
              setShowHint(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setTimeout(() => setShowHint(false), 200);
              props.onBlur?.(e);
            }}
            {...props}
          />
          {showHint && hint && (
            <div className={styles.hint}>
              {hint}
            </div>
          )}
        </div>
        {error && <span className={styles.errorText}>{error}</span>}
      </div>
    );
  }
);

InputWithHint.displayName = 'InputWithHint';

export default InputWithHint;

