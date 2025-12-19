import React from 'react';
import Image from 'next/image';
import classNames from 'classnames';
import styles from './Avatar.module.scss';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface AvatarProps {
  src?: string;
  alt?: string;
  size?: AvatarSize;
  gender?: 'male' | 'female' | 'unknown';
  fallback?: React.ReactNode;
  className?: string;
}

const getGenderIcon = (gender: 'male' | 'female' | 'unknown') => {
  switch (gender) {
    case 'male':
      return '♂';
    case 'female':
      return '♀';
    default:
      return '⚥';
  }
};

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = '',
  size = 'md',
  gender = 'unknown',
  fallback,
  className,
}) => {
  const sizeMap = {
    xs: 32,
    sm: 40,
    md: 56,
    lg: 80,
    xl: 120,
  };

  const imageSize = sizeMap[size];

  return (
    <div className={classNames(styles.avatar, styles[size], className)}>
      {src ? (
        <Image
          src={src}
          alt={alt}
          width={imageSize}
          height={imageSize}
          className={styles.image}
        />
      ) : fallback ? (
        <div className={styles.fallback}>{fallback}</div>
      ) : (
        <div className={styles.placeholder}>
          <span>{getGenderIcon(gender)}</span>
        </div>
      )}
    </div>
  );
};

