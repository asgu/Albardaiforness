import React, { useState, useRef, useEffect } from 'react';
import classNames from 'classnames';
import { useTranslations } from '@/i18n/useTranslations';
import styles from './Select.module.scss';

export interface SelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface SelectProps {
  options: SelectOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  label?: string;
  helperText?: string;
  fullWidth?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  searchable?: boolean;
}

export const Select = React.forwardRef<HTMLDivElement, SelectProps>(
  (
    {
      options,
      value: controlledValue,
      defaultValue,
      onChange,
      placeholder = 'Select...',
      disabled = false,
      error,
      label,
      helperText,
      fullWidth = false,
      className = '',
      size = 'md',
      searchable = false,
    },
    ref
  ) => {
    const { t } = useTranslations();
    const [isOpen, setIsOpen] = useState(false);
    const [selectedValue, setSelectedValue] = useState(controlledValue || defaultValue || '');
    const [searchQuery, setSearchQuery] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const isControlled = controlledValue !== undefined;
    const currentValue = isControlled ? controlledValue : selectedValue;

    const selectedOption = options.find((opt) => opt.value === currentValue);

    const filteredOptions = searchable && searchQuery
      ? options.filter((opt) =>
          opt.label.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : options;

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setIsOpen(false);
          setSearchQuery('');
        }
      };

      if (isOpen) {
        document.addEventListener('mousedown', handleClickOutside);
        if (searchable && searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }

      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, [isOpen, searchable]);

    const handleSelect = (option: SelectOption) => {
      if (option.disabled) return;

      if (!isControlled) {
        setSelectedValue(option.value);
      }

      onChange?.(option.value);
      setIsOpen(false);
      setSearchQuery('');
    };

    const handleToggle = () => {
      if (!disabled) {
        setIsOpen(!isOpen);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (disabled) return;

      switch (e.key) {
        case 'Enter':
        case ' ':
          e.preventDefault();
          setIsOpen(!isOpen);
          break;
        case 'Escape':
          setIsOpen(false);
          setSearchQuery('');
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (!isOpen) {
            setIsOpen(true);
          } else {
            const currentIndex = filteredOptions.findIndex((opt) => opt.value === currentValue);
            const nextIndex = (currentIndex + 1) % filteredOptions.length;
            handleSelect(filteredOptions[nextIndex]);
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (isOpen) {
            const currentIndex = filteredOptions.findIndex((opt) => opt.value === currentValue);
            const prevIndex = currentIndex <= 0 ? filteredOptions.length - 1 : currentIndex - 1;
            handleSelect(filteredOptions[prevIndex]);
          }
          break;
      }
    };

    const selectClasses = classNames(
      styles.select,
      styles[size],
      {
        [styles.fullWidth]: fullWidth,
        [styles.disabled]: disabled,
        [styles.error]: !!error,
        [styles.open]: isOpen,
      },
      className
    );

    return (
      <div ref={ref} className={selectClasses}>
        {label && (
          <label className={styles.label}>
            {label}
          </label>
        )}

        <div
          ref={containerRef}
          className={styles.selectContainer}
          onClick={handleToggle}
          onKeyDown={handleKeyDown}
          tabIndex={disabled ? -1 : 0}
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-disabled={disabled}
        >
          <div className={styles.selectTrigger}>
            {selectedOption ? (
              <div className={styles.selectedOption}>
                {selectedOption.icon && (
                  <span className={styles.optionIcon}>{selectedOption.icon}</span>
                )}
                <span className={styles.optionLabel}>{selectedOption.label}</span>
              </div>
            ) : (
              <span className={styles.placeholder}>{placeholder}</span>
            )}
            <span className={styles.arrow}>
              {isOpen ? '▲' : '▼'}
            </span>
          </div>

          {isOpen && (
            <div className={styles.dropdown} role="listbox">
              {searchable && (
                <div className={styles.searchContainer}>
                  <input
                    ref={searchInputRef}
                    type="text"
                    className={styles.searchInput}
                    placeholder={t('common.search')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              )}

              <div className={styles.optionsList}>
                {filteredOptions.length === 0 ? (
                  <div className={styles.noOptions}>No options found</div>
                ) : (
                  filteredOptions.map((option) => (
                    <div
                      key={option.value}
                      className={classNames(styles.option, {
                        [styles.selected]: option.value === currentValue,
                        [styles.optionDisabled]: option.disabled,
                      })}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelect(option);
                      }}
                      role="option"
                      aria-selected={option.value === currentValue}
                      aria-disabled={option.disabled}
                    >
                      {option.icon && (
                        <span className={styles.optionIcon}>{option.icon}</span>
                      )}
                      <span className={styles.optionLabel}>{option.label}</span>
                      {option.value === currentValue && (
                        <span className={styles.checkmark}>✓</span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {(error || helperText) && (
          <div className={error ? styles.errorText : styles.helperText}>
            {error || helperText}
          </div>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

