'use client';

import { useState } from 'react';
import { Input } from '../Input/Input';
import { Button } from '../Button/Button';
import classNames from 'classnames';
import styles from './SearchInput.module.scss';

export interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: (query: string) => void;
  placeholder?: string;
  showButton?: boolean;
  buttonText?: string;
  loading?: boolean;
  className?: string;
}

export function SearchInput({
  value,
  onChange,
  onSearch,
  placeholder = 'Search...',
  showButton = true,
  buttonText = 'Search',
  loading = false,
  className,
}: SearchInputProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      onSearch(value.trim());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit(e as any);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={classNames(styles.searchInput, className)}>
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder={placeholder}
        className={styles.input}
      />
      {showButton && (
        <Button type="submit" disabled={loading || !value.trim()}>
          {loading ? 'Loading...' : buttonText}
        </Button>
      )}
    </form>
  );
}

