'use client';

import { Person, Marriage } from '@/types';
import RelativeCard from '@/components/RelativeCard/RelativeCard';
import styles from './RelativesSection.module.scss';

interface RelativesSectionProps {
  title: string;
  relatives?: Person[] | { person: Person; marriageYear?: number; marriageDate?: string }[];
  showMarriageInfo?: boolean;
  isParentsSection?: boolean;
}

export default function RelativesSection({ 
  title, 
  relatives,
  showMarriageInfo = false,
  isParentsSection = false
}: RelativesSectionProps) {
  if (!relatives || relatives.length === 0) {
    return null;
  }

  const isMarriageArray = relatives.length > 0 && 'person' in relatives[0];

  // Special handling for parents section
  if (isParentsSection && !isMarriageArray) {
    const persons = relatives as Person[];
    const father = persons.find(p => p.gender === 'male');
    const mother = persons.find(p => p.gender === 'female');

    return (
      <div className={styles.relativeSection}>
        <h2>{title}</h2>
        <div className={`${styles.relatives} ${styles.parentsGrid}`}>
          <div className={styles.fatherSlot}>
            {father && (
              <RelativeCard 
                key={father.id}
                person={father}
              />
            )}
          </div>
          <div className={styles.motherSlot}>
            {mother && (
              <RelativeCard 
                key={mother.id}
                person={mother}
              />
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.relativeSection}>
      <h2>{title}</h2>
      <div className={styles.relatives}>
        {isMarriageArray ? (
          // Marriages with spouse info
          (relatives as { person: Person; marriageYear?: number; marriageDate?: string }[]).map((item, index) => (
            <RelativeCard 
              key={index}
              person={item.person}
              marriageYear={item.marriageYear}
              marriageDate={item.marriageDate}
              showMarriageInfo={showMarriageInfo}
            />
          ))
        ) : (
          // Regular persons
          (relatives as Person[]).map((person) => (
            <RelativeCard 
              key={person.id}
              person={person}
            />
          ))
        )}
      </div>
    </div>
  );
}

