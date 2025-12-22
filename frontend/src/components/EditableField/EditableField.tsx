'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/ui';
import { useTranslations } from '@/i18n/useTranslations';
import classNames from 'classnames';
import styles from './EditableField.module.scss';

interface EditableFieldProps {
  value: string;
  onSave: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'textarea';
  className?: string;
  hint?: string;
}

export default function EditableField({
  value,
  onSave,
  placeholder,
  type = 'text',
  className,
  hint,
}: EditableFieldProps) {
  const { t } = useTranslations();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing) {
      if (type === 'text') {
        inputRef.current?.focus();
      } else {
        textareaRef.current?.focus();
      }
    }
  }, [isEditing, type]);

  const handleSave = () => {
    if (editValue !== value) {
      onSave(editValue);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && type === 'text') {
      e.preventDefault();
      handleSave();
    }
    if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (!isEditing) {
    return (
      <div
        className={classNames(styles.displayValue, className)}
        onClick={() => setIsEditing(true)}
      >
        {value || <span className={styles.placeholder}>{placeholder || t('common.clickToEdit')}</span>}
      </div>
    );
  }

  if (type === 'textarea') {
    return (
      <div className={styles.editWrapper}>
        <textarea
          ref={textareaRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          className={classNames(styles.textarea, className)}
          placeholder={placeholder}
          rows={3}
        />
      </div>
    );
  }

  return (
    <div className={styles.editWrapper}>
      <Input
        ref={inputRef}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleSave}
        placeholder={placeholder}
        hint={hint}
        className={className}
      />
    </div>
  );
}

