'use client';

import { Modal } from '../Modal/Modal';
import { Button } from '../Button/Button';
import styles from './ConfirmModal.module.scss';

export interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Conferma',
  cancelText = 'Annulla',
  variant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const getIcon = () => {
    switch (variant) {
      case 'danger':
        return '⚠️';
      case 'warning':
        return '⚡';
      case 'info':
        return 'ℹ️';
      default:
        return '⚠️';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onCancel}>
      <div className={`${styles.confirmModal} ${styles[variant]}`}>
        <div className={styles.icon}>
          {getIcon()}
        </div>
        
        <h2 className={styles.title}>{title}</h2>
        
        <p className={styles.message}>{message}</p>
        
        <div className={styles.actions}>
          <Button 
            variant="secondary" 
            onClick={onCancel}
            className={styles.cancelButton}
          >
            {cancelText}
          </Button>
          <Button 
            variant={variant === 'danger' ? 'primary' : 'secondary'}
            onClick={onConfirm}
            className={styles.confirmButton}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

