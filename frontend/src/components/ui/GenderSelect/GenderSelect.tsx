import React from 'react';
import classNames from 'classnames';
import styles from './GenderSelect.module.scss';

export type GenderValue = 'male' | 'female' | 'any';

export interface GenderSelectProps {
  value?: GenderValue;
  onChange?: (value: GenderValue) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export const GenderSelect: React.FC<GenderSelectProps> = ({
  value = 'any',
  onChange,
  label,
  disabled = false,
  className,
}) => {
  const handleSelect = (selectedValue: GenderValue) => {
    if (!disabled && onChange) {
      // Toggle off if clicking the same value
      if (value === selectedValue) {
        onChange('any');
      } else {
        onChange(selectedValue);
      }
    }
  };

  const options = [
    { value: 'male' as GenderValue, label: 'Maschio', icon: '♂' },
    { value: 'female' as GenderValue, label: 'Femmina', icon: '♀' },
  ];

  return (
    <div className={classNames(styles.genderSelect, { [styles.disabled]: disabled }, className)}>
      {label && <label className={styles.label}>{label}</label>}
      <div className={styles.options}>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            className={classNames(styles.option, {
              [styles.selected]: value === option.value,
            })}
            onClick={() => handleSelect(option.value)}
            disabled={disabled}
          >
            <span className={styles.icon}>{option.icon}</span>
            <span className={styles.optionLabel}>{option.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

