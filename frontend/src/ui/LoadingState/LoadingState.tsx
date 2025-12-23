'use client';

import Loader from '../Loader/Loader';
import classNames from 'classnames';
import styles from './LoadingState.module.scss';

export interface LoadingStateProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
  className?: string;
}

export function LoadingState({ 
  text, 
  size = 'md', 
  fullScreen = false,
  className 
}: LoadingStateProps) {
  return (
    <div className={classNames(
      styles.loadingState,
      styles[size],
      { [styles.fullScreen]: fullScreen },
      className
    )}>
      <Loader text={text} />
    </div>
  );
}

