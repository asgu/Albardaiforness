'use client';

import { Button } from '../Button/Button';
import classNames from 'classnames';
import styles from './ErrorState.module.scss';

export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryText?: string;
  className?: string;
}

export function ErrorState({ 
  title = 'Error', 
  message, 
  onRetry, 
  retryText = 'Retry',
  className 
}: ErrorStateProps) {
  return (
    <div className={classNames(styles.errorState, className)}>
      <div className={styles.icon}>⚠️</div>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.message}>{message}</p>
      {onRetry && (
        <div className={styles.action}>
          <Button onClick={onRetry} variant="primary">
            {retryText}
          </Button>
        </div>
      )}
    </div>
  );
}

