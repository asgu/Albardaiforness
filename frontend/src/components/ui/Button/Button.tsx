import React from 'react';
import classNames from 'classnames';
import styles from './Button.module.scss';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      loading = false,
      disabled,
      icon,
      iconPosition = 'left',
      className,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={classNames(
          styles.button,
          styles[variant],
          styles[size],
          {
            [styles.fullWidth]: fullWidth,
            [styles.loading]: loading,
          },
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <span className={styles.spinner} />
        )}
        {!loading && icon && iconPosition === 'left' && (
          <span className={styles.iconLeft}>{icon}</span>
        )}
        {!loading && children}
        {!loading && icon && iconPosition === 'right' && (
          <span className={styles.iconRight}>{icon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

