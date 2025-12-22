'use client';

import { useEffect, useState } from 'react';
import { personApi } from '@/lib/api';
import { Card } from '@/components/ui';
import { useTranslations } from '@/i18n/useTranslations';
import RelativeCard from '@/components/RelativeCard/RelativeCard';
import { Person } from '@/types';
import styles from './BirthdayList.module.scss';

export default function BirthdayList() {
  const { t } = useTranslations();
  const [birthdays, setBirthdays] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBirthdays();
  }, []);

  const loadBirthdays = async () => {
    try {
      const response = await personApi.getTodayBirthdays();
      setBirthdays(response.data);
    } catch (error) {
      console.error('Error loading birthdays:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return null;
  }

  if (birthdays.length === 0) {
    return null;
  }

  return (
    <Card className={styles.birthdayCard}>
      <h2 className={styles.title}>{t('birthdays.title')}</h2>
      <div className={styles.list}>
        {birthdays.map((person) => (
          <RelativeCard 
            key={person.id} 
            person={person}
          />
        ))}
      </div>
    </Card>
  );
}

