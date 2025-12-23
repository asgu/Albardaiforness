'use client';

import { Input } from '../Input/Input';
import classNames from 'classnames';
import styles from './DateInput.module.scss';

export interface DateInputProps {
  label: string;
  year: string;
  month: string;
  day: string;
  onYearChange: (value: string) => void;
  onMonthChange: (value: string) => void;
  onDayChange: (value: string) => void;
  className?: string;
}

export function DateInput({
  label,
  year,
  month,
  day,
  onYearChange,
  onMonthChange,
  onDayChange,
  className,
}: DateInputProps) {
  return (
    <div className={classNames(styles.dateInput, className)}>
      <div className={styles.dateRow}>
        <Input
          label={label}
          type="number"
          value={year}
          onChange={(e) => onYearChange(e.target.value)}
          placeholder="YYYY"
          className={styles.yearInput}
        />
        <Input
          label=" "
          type="number"
          min="1"
          max="12"
          value={month}
          onChange={(e) => onMonthChange(e.target.value)}
          placeholder="MM"
          className={styles.monthInput}
        />
        <Input
          label=" "
          type="number"
          min="1"
          max="31"
          value={day}
          onChange={(e) => onDayChange(e.target.value)}
          placeholder="DD"
          className={styles.dayInput}
        />
      </div>
    </div>
  );
}

