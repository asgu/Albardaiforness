'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from '@/i18n/useTranslations';
import { Button, Input, Card, GenderSelect } from '@/ui';
import { personApi } from '@/lib/api';
import { Person } from '@/types';
import styles from './PersonForm.module.scss';

interface PersonFormProps {
  person?: Person; // If provided, it's edit mode
  mode: 'create' | 'edit';
}

export default function PersonForm({ person, mode }: PersonFormProps) {
  const { t } = useTranslations();
  const router = useRouter();

  const [formData, setFormData] = useState({
    firstName: person?.firstName || '',
    lastName: person?.lastName || '',
    nickName: person?.nickName || '',
    maidenName: person?.maidenName || '',
    gender: (person?.gender === 'male' || person?.gender === 'female' ? person.gender : undefined) as 'male' | 'female' | undefined,
    birthYear: person?.birthYear?.toString() || '',
    birthMonth: person?.birthMonth?.toString() || '',
    birthDay: person?.birthDay?.toString() || '',
    birthPlace: person?.birthPlace || '',
    deathYear: person?.deathYear?.toString() || '',
    deathMonth: person?.deathMonth?.toString() || '',
    deathDay: person?.deathDay?.toString() || '',
    deathPlace: person?.deathPlace || '',
    burialPlace: person?.burialPlace || '',
    occupation: person?.occupation || '',
    note: person?.note || '',
    privateNote: person?.privateNote || '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Update form data when person prop changes
  useEffect(() => {
    if (person) {
      setFormData({
        firstName: person.firstName || '',
        lastName: person.lastName || '',
        nickName: person.nickName || '',
        maidenName: person.maidenName || '',
        gender: (person.gender === 'male' || person.gender === 'female' ? person.gender : undefined) as 'male' | 'female' | undefined,
        birthYear: person.birthYear?.toString() || '',
        birthMonth: person.birthMonth?.toString() || '',
        birthDay: person.birthDay?.toString() || '',
        birthPlace: person.birthPlace || '',
        deathYear: person.deathYear?.toString() || '',
        deathMonth: person.deathMonth?.toString() || '',
        deathDay: person.deathDay?.toString() || '',
        deathPlace: person.deathPlace || '',
        burialPlace: person.burialPlace || '',
        occupation: person.occupation || '',
        note: person.note || '',
        privateNote: person.privateNote || '',
      });
    }
  }, [person]);

  const handleChange = (field: string, value: string | 'male' | 'female' | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.firstName || !formData.lastName) {
        setError(t('person.requiredFields'));
        setLoading(false);
        return;
      }

      // Convert year/month/day to numbers or null, and clean empty strings
      const data: any = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        maidenName: formData.maidenName || null,
        nickName: formData.nickName || null,
        birthYear: formData.birthYear ? parseInt(formData.birthYear) : null,
        birthMonth: formData.birthMonth ? parseInt(formData.birthMonth) : null,
        birthDay: formData.birthDay ? parseInt(formData.birthDay) : null,
        deathYear: formData.deathYear ? parseInt(formData.deathYear) : null,
        deathMonth: formData.deathMonth ? parseInt(formData.deathMonth) : null,
        deathDay: formData.deathDay ? parseInt(formData.deathDay) : null,
        gender: formData.gender || 'unknown',
        occupation: formData.occupation || null,
        note: formData.note || null,
        privateNote: formData.privateNote || null,
        birthPlace: formData.birthPlace || null,
        deathPlace: formData.deathPlace || null,
        burialPlace: formData.burialPlace || null,
      };

      if (mode === 'edit' && person) {
        await personApi.update(person.id, data);
        router.refresh();
        router.push(`/person/${person.originalId || person.id}`);
      } else {
        const response = await personApi.create(data);
        if (response.data && response.data.id) {
          // Redirect to person view page after creation (with edit mode available)
          const personId = response.data.originalId || response.data.id;
          router.push(`/person/${personId}`);
        } else {
          router.push('/');
        }
      }
    } catch (err: any) {
      console.error('Error saving person:', err);
      setError(err.response?.data?.error || t('common.error'));
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <Card className={styles.formCard}>
        <h1 className={styles.title}>
          {mode === 'edit' ? t('person.editPerson') : t('common.addPerson')}
        </h1>

        {error && (
          <div className={styles.error}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Names Section */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>{t('person.basicInfo')}</h2>
            
            <div className={styles.row}>
              <Input
                label={t('person.firstName')}
                value={formData.firstName}
                onChange={(e) => handleChange('firstName', e.target.value)}
                required
                fullWidth
              />
            </div>

            <div className={styles.row}>
              <Input
                label={t('person.lastName')}
                value={formData.lastName}
                onChange={(e) => handleChange('lastName', e.target.value)}
                required
                fullWidth
              />
            </div>

            <div className={styles.row}>
              <Input
                label={t('person.nickName')}
                value={formData.nickName}
                onChange={(e) => handleChange('nickName', e.target.value)}
                fullWidth
              />
            </div>

            <div className={styles.row}>
              <div className={styles.fieldLabel}>{t('person.gender')}</div>
              <GenderSelect
                value={formData.gender}
                onChange={(value) => handleChange('gender', value)}
              />
            </div>

            {formData.gender === 'female' && (
              <div className={styles.row}>
                <Input
                  label={t('person.maidenName')}
                  value={formData.maidenName}
                  onChange={(e) => handleChange('maidenName', e.target.value)}
                  fullWidth
                />
              </div>
            )}
          </div>

          {/* Birth Section */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>{t('person.birth')}</h2>
            
            <div className={styles.dateRow}>
              <Input
                label={t('person.year')}
                type="number"
                value={formData.birthYear}
                onChange={(e) => handleChange('birthYear', e.target.value)}
                placeholder="YYYY"
              />
              <Input
                label={t('person.month')}
                type="number"
                min="1"
                max="12"
                value={formData.birthMonth}
                onChange={(e) => handleChange('birthMonth', e.target.value)}
                placeholder="MM"
              />
              <Input
                label={t('person.day')}
                type="number"
                min="1"
                max="31"
                value={formData.birthDay}
                onChange={(e) => handleChange('birthDay', e.target.value)}
                placeholder="DD"
              />
            </div>

            <div className={styles.row}>
              <Input
                label={t('person.birthPlace')}
                value={formData.birthPlace}
                onChange={(e) => handleChange('birthPlace', e.target.value)}
                fullWidth
              />
            </div>
          </div>

          {/* Death Section */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>{t('person.death')}</h2>
            
            <div className={styles.dateRow}>
              <Input
                label={t('person.year')}
                type="number"
                value={formData.deathYear}
                onChange={(e) => handleChange('deathYear', e.target.value)}
                placeholder="YYYY"
              />
              <Input
                label={t('person.month')}
                type="number"
                min="1"
                max="12"
                value={formData.deathMonth}
                onChange={(e) => handleChange('deathMonth', e.target.value)}
                placeholder="MM"
              />
              <Input
                label={t('person.day')}
                type="number"
                min="1"
                max="31"
                value={formData.deathDay}
                onChange={(e) => handleChange('deathDay', e.target.value)}
                placeholder="DD"
              />
            </div>

            <div className={styles.row}>
              <Input
                label={t('person.deathPlace')}
                value={formData.deathPlace}
                onChange={(e) => handleChange('deathPlace', e.target.value)}
                fullWidth
              />
            </div>

            <div className={styles.row}>
              <Input
                label={t('person.burialPlace')}
                value={formData.burialPlace}
                onChange={(e) => handleChange('burialPlace', e.target.value)}
                fullWidth
              />
            </div>
          </div>

          {/* Additional Info Section */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>{t('person.additionalInfo')}</h2>
            
            <div className={styles.row}>
              <Input
                label={t('person.occupation')}
                value={formData.occupation}
                onChange={(e) => handleChange('occupation', e.target.value)}
                fullWidth
              />
            </div>

            <div className={styles.row}>
              <label className={styles.fieldLabel}>{t('person.note')}</label>
              <textarea
                className={styles.textarea}
                value={formData.note}
                onChange={(e) => handleChange('note', e.target.value)}
                rows={3}
              />
            </div>

            <div className={styles.row}>
              <label className={styles.fieldLabel}>{t('person.privateNote')}</label>
              <textarea
                className={styles.textarea}
                value={formData.privateNote}
                onChange={(e) => handleChange('privateNote', e.target.value)}
                rows={3}
              />
            </div>
          </div>

          {/* Actions */}
          <div className={styles.actions}>
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.back()}
              disabled={loading}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={loading}
            >
              {loading ? t('common.loading') : t('common.save')}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

