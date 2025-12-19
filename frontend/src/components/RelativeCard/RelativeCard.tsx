'use client';

import Link from 'next/link';
import { Person } from '@/types';
import { Avatar } from '@/components/ui';
import styles from './RelativeCard.module.scss';

interface RelativeCardProps {
  person: Person;
  marriageYear?: number | null;
  marriageDate?: string | null;
  showMarriageInfo?: boolean;
}

// Helper to get person ID for URLs (prefer originalId for SEO)
function getPersonUrlId(person: Person): string {
  return person.originalId || person.id;
}

const getGenderIcon = (gender: string) => {
  if (gender === 'male') return '♂';
  if (gender === 'female') return '♀';
  return '⚥';
};

export default function RelativeCard({ 
  person, 
  marriageYear,
  marriageDate,
  showMarriageInfo = false 
}: RelativeCardProps) {
  const formatLifespan = () => {
    if (person.birthYear && person.deathYear) {
      return `${person.birthYear} - ${person.deathYear}`;
    }
    if (person.birthYear) {
      return `${person.birthYear} - `;
    }
    if (person.deathYear) {
      return ` - ${person.deathYear}`;
    }
    return null;
  };

  const formatMarriageDate = () => {
    if (marriageDate) return marriageDate;
    if (marriageYear) return marriageYear.toString();
    return null;
  };

  const lifespan = formatLifespan();
  const marriage = showMarriageInfo ? formatMarriageDate() : null;

  return (
    <Link href={`/person/${getPersonUrlId(person)}`} className={styles.relativeCard}>
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
          <span className={styles.lastName}>{person.lastName}</span>
          <span className={styles.firstName}>{person.firstName}</span>
        </div>

        {person.nickName && (
          <div className={styles.nickName}>"{person.nickName}"</div>
        )}

        {person.maidenName && (
          <div className={styles.maidenName}>({person.maidenName})</div>
        )}

        {lifespan && (
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
    </Link>
  );
}

