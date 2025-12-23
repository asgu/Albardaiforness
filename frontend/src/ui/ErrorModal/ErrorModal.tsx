'use client';

import { Modal } from '../Modal/Modal';
import { Button } from '../Button/Button';
import styles from './ErrorModal.module.scss';

export interface ErrorModalProps {
  isOpen: boolean;
  title?: string;
  message: string;
  onClose: () => void;
}

export function ErrorModal({
  isOpen,
  title = 'Errore',
  message,
  onClose,
}: ErrorModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className={styles.errorModal}>
        <div className={styles.icon}>⚠️</div>
        
        <h2 className={styles.title}>{title}</h2>
        
        <p className={styles.message}>{message}</p>
        
        <div className={styles.actions}>
          <Button onClick={onClose}>
            OK
          </Button>
        </div>
      </div>
    </Modal>
  );
}

