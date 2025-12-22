'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from '@/i18n/useTranslations';
import { Person } from '@/types';
import { Button, Input, Select } from '@/components/ui';
import { personApi } from '@/lib/api';
import PersonInfoRow from '@/components/PersonInfoRow/PersonInfoRow';
import EditableField from '@/components/EditableField/EditableField';
import styles from './PersonalInfo.module.scss';

interface PersonalInfoProps {
  person: Person;
  isAuthenticated: boolean;
  isEditing: boolean;
  onEditingChange: (editing: boolean) => void;
}

// Helper to get person ID for URLs (prefer originalId for SEO)
function getPersonUrlId(person: Person): string {
  return person.originalId || person.id;
}

export default function PersonalInfo({ person, isAuthenticated, isEditing, onEditingChange }: PersonalInfoProps) {
  const { t } = useTranslations();
  const router = useRouter();

  const handleSaveField = async (field: string, value: string) => {
    try {
      await personApi.update(person.id, { [field]: value });
      router.refresh();
    } catch (error) {
      console.error('Error saving field:', error);
      alert(t('common.error'));
    }
  };

  const formatName = (firstName: string) => {
    const parts = firstName.split(' ');
    if (parts.length > 1) {
      return (
        <>
          <span className={styles.prime}>{parts[0]}</span>{' '}
          <span className={styles.secondary}>{parts.slice(1).join(' ')}</span>
        </>
      );
    }
    return <span className={styles.prime}>{firstName}</span>;
  };

  const formatDate = (year?: number, month?: number, day?: number, fullDate?: string) => {
    if (fullDate) return fullDate;
    if (year && month && day) return `${day}/${month}/${year}`;
    if (year && month) return `${month}/${year}`;
    if (year) return year.toString();
    return '';
  };

  const getGenderIcon = (gender: string) => {
    if (gender === 'male') return '♂';
    if (gender === 'female') return '♀';
    return '⚥';
  };

  const getGenderLabel = (gender: string) => {
    if (gender === 'male') return t('person.male');
    if (gender === 'female') return t('person.female');
    return t('person.unknown');
  };

  return (
    <div className={styles.personalInfo}>
      {/* Profile Header */}
      <div className={styles.profile}>
        <div className={styles.profileHeader}>
          <div className={styles.profileAvatar}>
            {person.avatarMediaId ? (
              <img 
                src={`/api/media/${person.avatarMediaId}`} 
                alt={`${person.firstName} ${person.lastName}`}
                className={styles.profilePhoto}
              />
            ) : (
              <div className={styles.noPhoto}>
                <span>{getGenderIcon(person.gender)}</span>
              </div>
            )}
          </div>

          <div className={styles.actionButtons}>
            <Link href={`/tree/${getPersonUrlId(person)}`}>
              <Button variant="secondary">
                {t('person.tree')}
              </Button>
            </Link>
            {isAuthenticated && (
              <Button 
                variant={isEditing ? 'secondary' : 'primary'}
                onClick={() => onEditingChange(!isEditing)}
              >
                {isEditing ? t('common.done') : t('common.edit')}
              </Button>
            )}
          </div>
        </div>

        <div className={styles.profileInfo}>
          {isEditing ? (
            <>
              <EditableField
                value={person.lastName}
                onSave={(value) => handleSaveField('lastName', value)}
                placeholder={t('person.lastName')}
              />
              <EditableField
                value={person.firstName}
                onSave={(value) => handleSaveField('firstName', value)}
                placeholder={t('person.firstName')}
              />
              <EditableField
                value={person.nickName || ''}
                onSave={(value) => handleSaveField('nickName', value)}
                placeholder={t('person.nickName')}
              />
              <EditableField
                value={person.maidenName || ''}
                onSave={(value) => handleSaveField('maidenName', value)}
                placeholder={t('person.maidenName')}
              />
            </>
          ) : (
            <>
              <div className={styles.lastName}>{person.lastName.toUpperCase()}</div>
              <div className={styles.firstName}>{formatName(person.firstName)}</div>
              {person.nickName && (
                <div className={styles.nickName}>
                  <span className={styles.secondary}>"{person.nickName}"</span>
                </div>
              )}
              {person.maidenName && (
                <div className={styles.maidenName}>
                  <span className={styles.secondary}>({person.maidenName})</span>
                </div>
              )}
            </>
          )}
        </div>

        {isEditing ? (
          <>
            <div className={styles.fullWidthInfo}>
              <strong>{t('person.occupation')}:</strong>
              <EditableField
                value={person.occupation || ''}
                onSave={(value) => handleSaveField('occupation', value)}
                placeholder={t('person.occupation')}
              />
            </div>
            <div className={styles.fullWidthInfo}>
              <strong>{t('person.note')}:</strong>
              <EditableField
                value={person.note || ''}
                onSave={(value) => handleSaveField('note', value)}
                placeholder={t('person.note')}
                type="textarea"
              />
            </div>
            {isAuthenticated && (
              <div className={styles.fullWidthInfo}>
                <strong>{t('person.privateNote')}:</strong>
                <EditableField
                  value={person.privateNote || ''}
                  onSave={(value) => handleSaveField('privateNote', value)}
                  placeholder={t('person.privateNote')}
                  type="textarea"
                />
              </div>
            )}
          </>
        ) : (
          <>
            {person.occupation && (
              <div className={styles.fullWidthInfo}>
                <strong>{t('person.occupation')}:</strong> {person.occupation}
              </div>
            )}

            {person.note && (
              <div className={styles.fullWidthInfo}>
                <strong>{t('person.note')}:</strong> {person.note}
              </div>
            )}

            {isAuthenticated && person.privateNote && (
              <div className={styles.fullWidthInfo}>
                <span className={styles.privateNote}>
                  <strong>{t('person.privateNote')}:</strong> {person.privateNote}
                </span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Details Table */}
      <div className={styles.profile}>
        <table className={styles.profileDetails}>
          <tbody>
            <PersonInfoRow label={t('person.id')} value={person.id} />
            
            {isEditing ? (
              <tr>
                <td>{t('person.gender')}</td>
                <td>
                  <Select
                    value={person.gender || ''}
                    onChange={(value) => handleSaveField('gender', value)}
                    options={[
                      { value: '', label: t('person.unknown') },
                      { value: 'male', label: t('person.male') },
                      { value: 'female', label: t('person.female') }
                    ]}
                  />
                </td>
              </tr>
            ) : (
              <PersonInfoRow label={t('person.gender')}>
                {getGenderIcon(person.gender)} {getGenderLabel(person.gender)}
              </PersonInfoRow>
            )}
            
            {isEditing ? (
              <>
                <tr>
                  <td>{t('person.birth')}</td>
                  <td>
                    <div className={styles.dateInputs}>
                      <Input
                        type="number"
                        placeholder={t('person.year')}
                        value={person.birthYear || ''}
                        onChange={(e) => handleSaveField('birthYear', e.target.value)}
                      />
                      <Input
                        type="number"
                        placeholder={t('person.month')}
                        min="1"
                        max="12"
                        value={person.birthMonth || ''}
                        onChange={(e) => handleSaveField('birthMonth', e.target.value)}
                      />
                      <Input
                        type="number"
                        placeholder={t('person.day')}
                        min="1"
                        max="31"
                        value={person.birthDay || ''}
                        onChange={(e) => handleSaveField('birthDay', e.target.value)}
                      />
                    </div>
                  </td>
                </tr>
                <tr>
                  <td>{t('person.birthPlace')}</td>
                  <td>
                    <EditableField
                      value={person.birthPlace || ''}
                      onSave={(value) => handleSaveField('birthPlace', value)}
                      placeholder={t('person.birthPlace')}
                    />
                  </td>
                </tr>
                <tr>
                  <td>{t('person.death')}</td>
                  <td>
                    <div className={styles.dateInputs}>
                      <Input
                        type="number"
                        placeholder={t('person.year')}
                        value={person.deathYear || ''}
                        onChange={(e) => handleSaveField('deathYear', e.target.value)}
                      />
                      <Input
                        type="number"
                        placeholder={t('person.month')}
                        min="1"
                        max="12"
                        value={person.deathMonth || ''}
                        onChange={(e) => handleSaveField('deathMonth', e.target.value)}
                      />
                      <Input
                        type="number"
                        placeholder={t('person.day')}
                        min="1"
                        max="31"
                        value={person.deathDay || ''}
                        onChange={(e) => handleSaveField('deathDay', e.target.value)}
                      />
                    </div>
                  </td>
                </tr>
                <tr>
                  <td>{t('person.deathPlace')}</td>
                  <td>
                    <EditableField
                      value={person.deathPlace || ''}
                      onSave={(value) => handleSaveField('deathPlace', value)}
                      placeholder={t('person.deathPlace')}
                    />
                  </td>
                </tr>
                <tr>
                  <td>{t('person.burialPlace')}</td>
                  <td>
                    <EditableField
                      value={person.burialPlace || ''}
                      onSave={(value) => handleSaveField('burialPlace', value)}
                      placeholder={t('person.burialPlace')}
                    />
                  </td>
                </tr>
              </>
            ) : (
              <>
                <PersonInfoRow 
                  label={t('person.birth')} 
                  value={formatDate(person.birthYear, person.birthMonth, person.birthDay, person.birthDate)} 
                />
                <PersonInfoRow label={t('person.birthPlace')} value={person.birthPlace} />
                <PersonInfoRow 
                  label={t('person.death')} 
                  value={formatDate(person.deathYear, person.deathMonth, person.deathDay, person.deathDate)} 
                />
                <PersonInfoRow label={t('person.deathPlace')} value={person.deathPlace} />
                <PersonInfoRow label={t('person.burialPlace')} value={person.burialPlace} />
              </>
            )}
            
            <PersonInfoRow label={t('person.age')} value={person.age ? `${person.age} ${t('person.years')}` : undefined} />
          </tbody>
        </table>
      </div>
    </div>
  );
}

