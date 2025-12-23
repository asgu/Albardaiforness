'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from '@/i18n/useTranslations';
import { Person } from '@/types';
import { Button, Input, Select } from '@/ui';
import { personApi } from '@/lib/api';
import PersonInfoRow from '@/components/PersonInfoRow/PersonInfoRow';
import EditableField from '@/components/EditableField/EditableField';
import { capitalizeWords } from '@/utils/string';
import { getPersonUrlId, getGenderIcon, formatDate } from '@/utils/person';
import styles from './PersonalInfo.module.scss';

interface PersonalInfoProps {
  person: Person;
  isAuthenticated: boolean;
  isEditing: boolean;
  onEditingChange: (editing: boolean) => void;
}

export default function PersonalInfo({ person, isAuthenticated, isEditing, onEditingChange }: PersonalInfoProps) {
  const { t } = useTranslations();
  const router = useRouter();
  const [dateFields, setDateFields] = useState({
    birthYear: person.birthYear?.toString() || '',
    birthMonth: person.birthMonth?.toString() || '',
    birthDay: person.birthDay?.toString() || '',
    deathYear: person.deathYear?.toString() || '',
    deathMonth: person.deathMonth?.toString() || '',
    deathDay: person.deathDay?.toString() || '',
  });

  const handleSaveField = async (field: string, value: string) => {
    try {
      // Convert empty strings to null for number fields
      const processedValue = value === '' ? null : value;
      await personApi.update(person.id, { [field]: processedValue });
      router.refresh();
    } catch (error) {
      console.error('Error saving field:', error);
      alert(t('common.error'));
    }
  };

  const handleDateFieldChange = (field: keyof typeof dateFields, value: string) => {
    setDateFields(prev => ({ ...prev, [field]: value }));
  };

  const handleDateFieldBlur = async (field: string, value: string) => {
    // Convert to number or null
    const numValue = value === '' ? null : parseInt(value, 10);
    await handleSaveField(field, numValue as any);
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
              <div className={styles.lastName}>{capitalizeWords(person.lastName).toUpperCase()}</div>
              <div className={styles.firstName}>{formatName(capitalizeWords(person.firstName))}</div>
              {person.nickName && (
                <div className={styles.nickName}>
                  <span className={styles.secondary}>"{capitalizeWords(person.nickName)}"</span>
                </div>
              )}
              {person.maidenName && (
                <div className={styles.maidenName}>
                  <span className={styles.secondary}>({capitalizeWords(person.maidenName)})</span>
                </div>
              )}
            </>
          )}
        </div>

      </div>

      {/* Details Table */}
      <div className={styles.profile}>
        <table className={styles.profileDetails}>
          <tbody>
            <PersonInfoRow label={t('person.id')} value={person.originalId || person.id} />
            
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
                        value={dateFields.birthYear}
                        onChange={(e) => handleDateFieldChange('birthYear', e.target.value)}
                        onBlur={(e) => handleDateFieldBlur('birthYear', e.target.value)}
                      />
                      <Input
                        type="number"
                        placeholder={t('person.month')}
                        min="1"
                        max="12"
                        value={dateFields.birthMonth}
                        onChange={(e) => handleDateFieldChange('birthMonth', e.target.value)}
                        onBlur={(e) => handleDateFieldBlur('birthMonth', e.target.value)}
                      />
                      <Input
                        type="number"
                        placeholder={t('person.day')}
                        min="1"
                        max="31"
                        value={dateFields.birthDay}
                        onChange={(e) => handleDateFieldChange('birthDay', e.target.value)}
                        onBlur={(e) => handleDateFieldBlur('birthDay', e.target.value)}
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
                        value={dateFields.deathYear}
                        onChange={(e) => handleDateFieldChange('deathYear', e.target.value)}
                        onBlur={(e) => handleDateFieldBlur('deathYear', e.target.value)}
                      />
                      <Input
                        type="number"
                        placeholder={t('person.month')}
                        min="1"
                        max="12"
                        value={dateFields.deathMonth}
                        onChange={(e) => handleDateFieldChange('deathMonth', e.target.value)}
                        onBlur={(e) => handleDateFieldBlur('deathMonth', e.target.value)}
                      />
                      <Input
                        type="number"
                        placeholder={t('person.day')}
                        min="1"
                        max="31"
                        value={dateFields.deathDay}
                        onChange={(e) => handleDateFieldChange('deathDay', e.target.value)}
                        onBlur={(e) => handleDateFieldBlur('deathDay', e.target.value)}
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
                <tr>
                  <td>{t('person.occupation')}</td>
                  <td>
                    <EditableField
                      value={person.occupation || ''}
                      onSave={(value) => handleSaveField('occupation', value)}
                      placeholder={t('person.occupation')}
                    />
                  </td>
                </tr>
                <tr>
                  <td>{t('person.note')}</td>
                  <td>
                    <EditableField
                      value={person.note || ''}
                      onSave={(value) => handleSaveField('note', value)}
                      placeholder={t('person.note')}
                      type="textarea"
                    />
                  </td>
                </tr>
                {isAuthenticated && (
                  <tr>
                    <td>{t('person.privateNote')}</td>
                    <td>
                      <EditableField
                        value={person.privateNote || ''}
                        onSave={(value) => handleSaveField('privateNote', value)}
                        placeholder={t('person.privateNote')}
                        type="textarea"
                      />
                    </td>
                  </tr>
                )}
              </>
            ) : (
              <>
                <PersonInfoRow 
                  label={t('person.birth')} 
                  value={formatDate(person.birthYear, person.birthMonth, person.birthDay, person.birthDate)} 
                />
                <PersonInfoRow label={t('person.birthPlace')} value={person.birthPlace ? capitalizeWords(person.birthPlace) : undefined} />
                <PersonInfoRow 
                  label={t('person.death')} 
                  value={formatDate(person.deathYear, person.deathMonth, person.deathDay, person.deathDate)} 
                />
                <PersonInfoRow label={t('person.deathPlace')} value={person.deathPlace ? capitalizeWords(person.deathPlace) : undefined} />
                <PersonInfoRow label={t('person.burialPlace')} value={person.burialPlace ? capitalizeWords(person.burialPlace) : undefined} />
                <PersonInfoRow label={t('person.occupation')} value={person.occupation ? capitalizeWords(person.occupation) : undefined} />
                <PersonInfoRow label={t('person.note')} value={person.note} />
                {isAuthenticated && person.privateNote && (
                  <PersonInfoRow label={t('person.privateNote')}>
                    <span className={styles.privateNote}>{person.privateNote}</span>
                  </PersonInfoRow>
                )}
              </>
            )}
            
            <PersonInfoRow label={t('person.age')} value={person.age ? `${person.age} ${t('person.years')}` : undefined} />
          </tbody>
        </table>
      </div>
    </div>
  );
}

