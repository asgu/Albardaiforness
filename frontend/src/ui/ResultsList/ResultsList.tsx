'use client';

import classNames from 'classnames';
import styles from './ResultsList.module.scss';

export interface ResultsListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T, index: number) => string | number;
  columns?: 1 | 2 | 3 | 4;
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ResultsList<T>({
  items,
  renderItem,
  keyExtractor,
  columns = 1,
  gap = 'md',
  className,
}: ResultsListProps<T>) {
  return (
    <div 
      className={classNames(
        styles.resultsList,
        styles[`columns${columns}`],
        styles[`gap${gap.charAt(0).toUpperCase() + gap.slice(1)}`],
        className
      )}
    >
      {items.map((item, index) => (
        <div key={keyExtractor(item, index)} className={styles.item}>
          {renderItem(item, index)}
        </div>
      ))}
    </div>
  );
}

