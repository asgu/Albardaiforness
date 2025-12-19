import Link from 'next/link';
import Header from '@/components/Header/Header';
import styles from './page.module.scss';

export default function NotFound() {
  return (
    <>
      <Header />
      <main className={styles.main}>
        <div className={styles.error}>
          <h1>404</h1>
          <h2>Persona non trovata</h2>
          <p>La persona che stai cercando non esiste o è stata rimossa.</p>
          <Link href="/" className={styles.backLink}>
            Torna alla home
          </Link>
        </div>
      </main>
    </>
  );
}

