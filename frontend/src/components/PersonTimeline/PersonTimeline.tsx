'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Card } from '@/ui';
import { useTranslations } from '@/i18n/useTranslations';
import { capitalizeWords } from '@/utils/string';
import { Person } from '@/types';
import styles from './PersonTimeline.module.scss';

interface TimelineEvent {
  year: number;
  type: 'birth' | 'marriage' | 'divorce' | 'child_birth' | 'death';
  description: string;
  relatedPerson?: {
    id: string;
    name: string;
  };
}

interface PersonTimelineProps {
  person: Person;
}

export default function PersonTimeline({ person }: PersonTimelineProps) {
  const { t } = useTranslations();

  const events = useMemo(() => {
    const timelineEvents: TimelineEvent[] = [];

    // Рождение
    if (person.birthYear) {
      timelineEvents.push({
        year: person.birthYear,
        type: 'birth',
        description: t('timeline.born'),
      });
    }

    // Браки
    person.spouses?.forEach((marriage) => {
      const spouse = marriage.person;
      
      if (marriage.marriageYear && spouse) {
        timelineEvents.push({
          year: marriage.marriageYear,
          type: 'marriage',
          description: t('timeline.married'),
        relatedPerson: {
          id: spouse.id,
          name: `${capitalizeWords(spouse.firstName)} ${capitalizeWords(spouse.lastName)}`,
        },
        });
      }

      if (marriage.divorceYear && spouse) {
        timelineEvents.push({
          year: marriage.divorceYear,
          type: 'divorce',
          description: t('timeline.divorced'),
        relatedPerson: {
          id: spouse.id,
          name: `${capitalizeWords(spouse.firstName)} ${capitalizeWords(spouse.lastName)}`,
        },
        });
      }
    });

    // Рождение детей
    person.children?.forEach((child) => {
      if (child.birthYear) {
        const childType = child.gender === 'male' ? t('timeline.sonBorn') : 
                         child.gender === 'female' ? t('timeline.daughterBorn') : 
                         t('timeline.childBorn');
        
        timelineEvents.push({
          year: child.birthYear,
          type: 'child_birth',
          description: childType,
        relatedPerson: {
          id: child.id,
          name: `${capitalizeWords(child.firstName)} ${capitalizeWords(child.lastName)}`,
        },
        });
      }
    });

    // Смерть
    if (person.deathYear) {
      timelineEvents.push({
        year: person.deathYear,
        type: 'death',
        description: t('timeline.died'),
      });
    }

    // Сортируем по годам
    return timelineEvents.sort((a, b) => a.year - b.year);
  }, [person, t]);

  if (events.length === 0) {
    return null;
  }

  return (
    <Card className={styles.timeline}>
      <h3 className={styles.title}>{t('timeline.title')}</h3>
      <div className={styles.events}>
        {events.map((event, index) => (
          <div key={index} className={`${styles.event} ${styles[event.type]}`}>
            <div className={styles.year}>{event.year}</div>
            <div className={styles.marker}></div>
            <div className={styles.content}>
              <div className={styles.description}>{event.description}</div>
              {event.relatedPerson && (
                <Link 
                  href={`/person/${event.relatedPerson.id}`}
                  className={styles.relatedPerson}
                >
                  {event.relatedPerson.name}
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

