'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAppSelector } from '@/store/hooks';
import { selectIsAuthenticated } from '@/store/slices/authSlice';
import { Person, Gender } from '@/types';
import { Button } from '@/components/ui';
import RelativesSection from '@/components/RelativesSection/RelativesSection';
import PersonInfoRow from '@/components/PersonInfoRow/PersonInfoRow';
import PersonTimeline from '@/components/PersonTimeline/PersonTimeline';
import EditableField from '@/components/EditableField/EditableField';
import AddRelativeModal from '@/components/AddRelativeModal/AddRelativeModal';
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
  const [isEditing, setIsEditing] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalRelationType, setModalRelationType] = useState<'father' | 'mother' | 'spouse' | 'child'>('father');

  const handleSaveField = async (field: string, value: string) => {
    console.log('Saving field:', field, value);
    // TODO: API call to update person
  };

  const handleAddRelative = (relationType: 'father' | 'mother' | 'spouse' | 'child') => {
    setModalRelationType(relationType);
    setModalOpen(true);
  };

  const handleSelectRelative = async (selectedPerson: any, relationType: string) => {
    console.log('Adding relative:', selectedPerson, relationType);
    // TODO: API call to link relative
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
                  <Button 
                    variant={isEditing ? 'secondary' : 'primary'}
                    onClick={() => setIsEditing(!isEditing)}
                  >
                    {isEditing ? 'Fine' : 'Modifica'}
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
                    placeholder="Cognome"
                  />
                  <EditableField
                    value={person.firstName}
                    onSave={(value) => handleSaveField('firstName', value)}
                    placeholder="Nome"
                  />
                  <EditableField
                    value={person.nickName || ''}
                    onSave={(value) => handleSaveField('nickName', value)}
                    placeholder="Soprannome"
                  />
                  <EditableField
                    value={person.maidenName || ''}
                    onSave={(value) => handleSaveField('maidenName', value)}
                    placeholder="Nome da nubile"
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
                  <strong>Professione:</strong>
                  <EditableField
                    value={person.occupation || ''}
                    onSave={(value) => handleSaveField('occupation', value)}
                    placeholder="Professione"
                  />
                </div>
                <div className={styles.fullWidthInfo}>
                  <strong>Nota:</strong>
                  <EditableField
                    value={person.note || ''}
                    onSave={(value) => handleSaveField('note', value)}
                    placeholder="Nota"
                    type="textarea"
                  />
                </div>
                {isAuthenticated && (
                  <div className={styles.fullWidthInfo}>
                    <strong>Nota privata:</strong>
                    <EditableField
                      value={person.privateNote || ''}
                      onSave={(value) => handleSaveField('privateNote', value)}
                      placeholder="Nota privata"
                      type="textarea"
                    />
                  </div>
                )}
              </>
            ) : (
              <>
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
              </>
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
            isEditing={isEditing}
            onAddRelative={() => handleAddRelative('father')}
          />

          {/* Spouses */}
          <RelativesSection 
            title="Coniugi"
            relatives={person.spouses}
            showMarriageInfo={true}
            isEditing={isEditing}
            onAddRelative={() => handleAddRelative('spouse')}
          />

          {/* Children */}
          <RelativesSection 
            title={`Figli${person.children ? ` (${person.children.length})` : ''}`}
            relatives={person.children}
            isEditing={isEditing}
            onAddRelative={() => handleAddRelative('child')}
          />

          {/* Timeline */}
          <PersonTimeline person={person} />
        </div>
      </div>

      {/* Add Relative Modal */}
      <AddRelativeModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSelect={handleSelectRelative}
        relationType={modalRelationType}
      />
    </div>
  );
}

