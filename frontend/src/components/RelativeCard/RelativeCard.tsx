'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PersonSummary } from '@/types';
import { Avatar, ConfirmModal } from '@/ui';
import { capitalizeWords } from '@/utils/string';
import { getPersonUrlId, getGenderIcon, getLifeYears } from '@/utils/person';
import { useTranslations } from '@/i18n/useTranslations';
import styles from './RelativeCard.module.scss';

export interface RelativeCardProps {
  person: PersonSummary & {
    maidenName?: string;
  };
  marriageYear?: number | null;
  marriageDate?: string | null;
  showMarriageInfo?: boolean;
  isAuthenticated?: boolean;
  isHighlighted?: boolean;
  isEditing?: boolean;
  onRemove?: (personId: string) => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export default function RelativeCard({ 
  person, 
  marriageYear,
  marriageDate,
  showMarriageInfo = false,
  isAuthenticated = false,
  isHighlighted = false,
  isEditing = false,
  onRemove,
  onMouseEnter,
  onMouseLeave
}: RelativeCardProps) {
  const { t } = useTranslations();
  const [showConfirm, setShowConfirm] = useState(false);
  
  const handleRemoveClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowConfirm(true);
  };

  const handleConfirmRemove = () => {
    if (onRemove) {
      onRemove(person.id);
    }
    setShowConfirm(false);
  };

  const handleCancelRemove = () => {
    setShowConfirm(false);
  };

  const formatMarriageDate = () => {
    if (marriageDate) return marriageDate;
    if (marriageYear) return marriageYear.toString();
    return null;
  };

  const lifespan = getLifeYears(person);
  const marriage = showMarriageInfo ? formatMarriageDate() : null;

  return (
    <>
      <Link 
        href={`/person/${getPersonUrlId(person)}`} 
        className={`${styles.relativeCard} ${isHighlighted ? styles.highlighted : ''}`}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        <div className={styles.avatar}>
          {person.avatarMediaId ? (
            <img 
              src={`/api/media/${person.avatarMediaId}`} 
              alt={`${person.firstName} ${person.lastName}`}
            />
          ) : (
            <div className={styles.noPhoto}>
              <span>{getGenderIcon(person.gender)}</span>
            </div>
          )}
        </div>

        <div className={styles.info}>
          <div className={styles.name}>
            <span className={styles.lastName}>{capitalizeWords(person.lastName)}</span>
            <span className={styles.firstName}>{capitalizeWords(person.firstName)}</span>
          </div>

          {isAuthenticated && (person.originalId || person.id) && (
            <div className={styles.personId}>ID: {person.originalId || person.id}</div>
          )}

          {person.nickName && (
            <div className={styles.nickName}>"{capitalizeWords(person.nickName)}"</div>
          )}

          {person.maidenName && person.gender === 'female' && (
            <div className={styles.maidenName}>({capitalizeWords(person.maidenName)})</div>
          )}

          {lifespan && lifespan !== '?' && (
            <div className={styles.lifespan}>
              {lifespan}
            </div>
          )}

          {marriage && (
            <div className={styles.marriage}>
              ⚭ {marriage}
            </div>
          )}
        </div>

        {isEditing && onRemove && (
          <button 
            className={styles.removeButton}
            onClick={handleRemoveClick}
            title={t('common.remove')}
          >
            ×
          </button>
        )}
      </Link>

      {isEditing && onRemove && (
        <ConfirmModal
          isOpen={showConfirm}
          title={t('person.removeRelativeTitle')}
          message={t('person.removeRelativeMessage', { 
            name: `${capitalizeWords(person.firstName)} ${capitalizeWords(person.lastName)}` 
          })}
          confirmText={t('common.remove')}
          cancelText={t('common.cancel')}
          variant="danger"
          onConfirm={handleConfirmRemove}
          onCancel={handleCancelRemove}
        />
      )}
    </>
  );
}

