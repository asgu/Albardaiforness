'use client';

import Link from 'next/link';
import { useAppSelector } from '@/store/hooks';
import { selectIsAuthenticated } from '@/store/slices/authSlice';
import { Person, Gender } from '@/types';
import RelativesSection from '@/components/RelativesSection/RelativesSection';
import PersonInfoRow from '@/components/PersonInfoRow/PersonInfoRow';
import PersonTimeline from '@/components/PersonTimeline/PersonTimeline';
import styles from './PersonProfile.module.scss';

interface PersonProfileProps {
  person: Person;
  serverColor: string;
}

// Helper to get person ID for URLs (prefer originalId for SEO)
function getPersonUrlId(person: Person): string {
  return person.originalId || person.id;
}

export default function PersonProfile({ person, serverColor }: PersonProfileProps) {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

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
    if (gender === 'male') return 'Maschio';
    if (gender === 'female') return 'Femmina';
    return 'Non specificato';
  };

  return (
    <div className={styles.profilePage}>
      <div className={styles.container}>
        {/* Left Column - Main Info */}
        <div className={styles.leftColumn}>
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
                  <button className={styles.treeButton}>Albero</button>
                </Link>
                {isAuthenticated && (
                  <Link href={`/admin/person/${getPersonUrlId(person)}/edit`}>
                    <button className={styles.editButton}>Modifica</button>
                  </Link>
                )}
              </div>
            </div>

            <div className={styles.profileInfo}>
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
            </div>

            {person.occupation && (
              <div className={styles.fullWidthInfo}>
                <strong>Professione:</strong> {person.occupation}
              </div>
            )}

            {person.note && (
              <div className={styles.fullWidthInfo}>
                <strong>Nota:</strong> {person.note}
              </div>
            )}

            {isAuthenticated && person.privateNote && (
              <div className={styles.fullWidthInfo}>
                <span className={styles.privateNote}>
                  <strong>Nota privata:</strong> {person.privateNote}
                </span>
              </div>
            )}
          </div>

          {/* Details Table */}
          <div className={styles.profile}>
            <table className={styles.profileDetails}>
              <tbody>
                <PersonInfoRow label="ID" value={person.id} />
                
                <PersonInfoRow label="Sesso">
                  {getGenderIcon(person.gender)} {getGenderLabel(person.gender)}
                </PersonInfoRow>
                
                <PersonInfoRow 
                  label="Nascita" 
                  value={formatDate(person.birthYear, person.birthMonth, person.birthDay, person.birthDate)} 
                />
                <PersonInfoRow label="Luogo di nascita" value={person.birthPlace} />
                <PersonInfoRow 
                  label="Morte" 
                  value={formatDate(person.deathYear, person.deathMonth, person.deathDay, person.deathDate)} 
                />
                <PersonInfoRow label="Luogo di morte" value={person.deathPlace} />
                <PersonInfoRow label="Luogo di sepoltura" value={person.burialPlace} />
                <PersonInfoRow label="Età" value={person.age ? `${person.age} anni` : undefined} />
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column - Relations */}
        <div className={styles.rightColumn}>
          {/* Parents */}
          <RelativesSection 
            title="Genitori"
            relatives={[person.father, person.mother].filter(Boolean) as Person[]}
            isParentsSection={true}
          />

          {/* Spouses */}
          <RelativesSection 
            title="Coniugi"
            relatives={person.spouses}
            showMarriageInfo={true}
          />

          {/* Children */}
          <RelativesSection 
            title={`Figli${person.children ? ` (${person.children.length})` : ''}`}
            relatives={person.children}
          />

          {/* Timeline */}
          <PersonTimeline person={person} />
        </div>
      </div>
    </div>
  );
}

