'use client';

import classNames from 'classnames';
import styles from './SectionHeader.module.scss';

export interface SectionHeaderProps {
  title: string;
  action?: React.ReactNode;
  className?: string;
}

export function SectionHeader({ title, action, className }: SectionHeaderProps) {
  return (
    <div className={classNames(styles.sectionHeader, className)}>
      <h2 className={styles.title}>{title}</h2>
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}

