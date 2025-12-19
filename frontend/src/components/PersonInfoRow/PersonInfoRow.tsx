'use client';

import styles from './PersonInfoRow.module.scss';

interface PersonInfoRowProps {
  label: string;
  value?: string | number | null;
  children?: React.ReactNode;
}

export default function PersonInfoRow({ label, value, children }: PersonInfoRowProps) {
  if (!value && !children) {
    return null;
  }

  return (
    <tr className={styles.infoRow}>
      <td className={styles.label}>{label}:</td>
      <td className={styles.value}>{children || value}</td>
    </tr>
  );
}

