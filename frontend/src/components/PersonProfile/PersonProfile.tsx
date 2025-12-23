'use client';

import { useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import { selectIsAuthenticated } from '@/store/slices/authSlice';
import { Person } from '@/types';
import PersonalInfo from '@/components/PersonalInfo/PersonalInfo';
import RelativeInfo from '@/components/RelativeInfo/RelativeInfo';
import PersonTimeline from '@/components/PersonTimeline/PersonTimeline';
import MediaGallery from '@/components/MediaGallery/MediaGallery';
import FamilyTree from '@/components/FamilyTree/FamilyTree';
import styles from './PersonProfile.module.scss';

interface PersonProfileProps {
  person: Person;
  serverColor: string;
}

export default function PersonProfile({ person, serverColor }: PersonProfileProps) {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className={styles.profilePage}>
      <div className={styles.container}>
        {/* Left Column - Personal Info */}
        <div className={styles.leftColumn}>
          <PersonalInfo 
            person={person} 
            isAuthenticated={isAuthenticated}
            isEditing={isEditing}
            onEditingChange={setIsEditing}
          />
          
          {/* Timeline - Desktop only */}
          <div className={styles.timelineDesktop}>
            <PersonTimeline person={person} />
          </div>
        </div>

        {/* Right Column - Relatives */}
        <div className={styles.rightColumn}>
          <RelativeInfo 
            person={person} 
            isAuthenticated={isAuthenticated}
            isEditing={isEditing}
          />
          
          {/* Timeline - Mobile only */}
          <div className={styles.timelineMobile}>
            <PersonTimeline person={person} />
          </div>
        </div>
        
        {/* Media Gallery - Full width across both columns */}
        <div className={styles.galleryFullWidth}>
          <MediaGallery personId={person.id} />
        </div>
      </div>
      
      {/* Family Tree - Full width at bottom */}
      <div className={styles.treeSection}>
        <FamilyTree person={person} />
      </div>
    </div>
  );
}

