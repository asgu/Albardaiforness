'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { personApi } from '@/lib/api';
import { Card, Avatar } from '@/components/ui';
import { useTranslations } from '@/i18n/useTranslations';
import styles from './BirthdayList.module.scss';

interface Person {
  id: string;
  originalId?: string;
  firstName: string;
  lastName: string;
  birthYear?: number;
  birthMonth?: number;
  birthDay?: number;
  avatarMedia?: {
    filePath: string;
    thumbnailPath: string;
  };
}

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

  const calculateAge = (birthYear?: number) => {
    if (!birthYear) return null;
    return new Date().getFullYear() - birthYear;
  };

  return (
    <Card className={styles.birthdayCard}>
      <h2 className={styles.title}>{t('birthdays.title')}</h2>
      <div className={styles.list}>
        {birthdays.map((person) => {
          const age = calculateAge(person.birthYear);
          const personId = person.originalId || person.id;
          return (
            <Link 
              key={person.id} 
              href={`/person/${personId}`}
              className={styles.birthdayItem}
            >
              <Avatar
                src={person.avatarMedia?.thumbnailPath}
                alt={`${person.firstName} ${person.lastName}`}
                size="md"
              />
              <div className={styles.info}>
                <div className={styles.name}>
                  {person.firstName} {person.lastName}
                </div>
                {age && (
                  <div className={styles.age}>
                    {age} {t('person.years')}
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </Card>
  );
}

