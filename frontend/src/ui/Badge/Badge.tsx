'use client';

import classNames from 'classnames';
import styles from './Badge.module.scss';

export type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info';
export type BadgeSize = 'sm' | 'md' | 'lg';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  className?: string;
}

export function Badge({ 
  children, 
  variant = 'default', 
  size = 'md',
  className 
}: BadgeProps) {
  return (
    <span className={classNames(
      styles.badge,
      styles[variant],
      styles[size],
      className
    )}>
      {children}
    </span>
  );
}

