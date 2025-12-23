'use client';

import { forwardRef } from 'react';
import classNames from 'classnames';
import styles from './Textarea.module.scss';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  fullWidth?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, fullWidth = false, className, ...props }, ref) => {
    return (
      <div className={classNames(styles.textareaWrapper, { [styles.fullWidth]: fullWidth })}>
        {label && (
          <label className={styles.label}>
            {label}
            {props.required && <span className={styles.required}>*</span>}
          </label>
        )}
        
        <textarea
          ref={ref}
          className={classNames(
            styles.textarea,
            {
              [styles.error]: error,
            },
            className
          )}
          {...props}
        />
        
        {hint && !error && <span className={styles.hint}>{hint}</span>}
        {error && <span className={styles.errorText}>{error}</span>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

