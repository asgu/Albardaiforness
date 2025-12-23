'use client';

import classNames from 'classnames';
import styles from './FormSection.module.scss';

export interface FormSectionProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function FormSection({ title, children, className }: FormSectionProps) {
  return (
    <div className={classNames(styles.section, className)}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      {children}
    </div>
  );
}

