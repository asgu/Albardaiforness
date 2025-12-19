import { notFound } from 'next/navigation';
import Header from '@/components/Header/Header';
import FamilyTree from '@/components/FamilyTree/FamilyTree';
import { Person } from '@/types';
import styles from './page.module.scss';

async function getPerson(id: string): Promise<Person | null> {
  try {
    const apiUrl = process.env.NODE_ENV === 'production'
      ? 'http://localhost:3300'
      : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3300');
    
    const response = await fetch(`${apiUrl}/person/${id}`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      return null;
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching person:', error);
    return null;
  }
}

export default async function TreePage({ params }: { params: { id: string } }) {
  const person = await getPerson(params.id);

  if (!person) {
    notFound();
  }

  return (
    <>
      <Header />
      <main className={styles.main}>
        <FamilyTree person={person} />
      </main>
    </>
  );
}

export async function generateMetadata({ params }: { params: { id: string } }) {
  const person = await getPerson(params.id);

  if (!person) {
    return {
      title: 'Albero genealogico - Albero',
    };
  }

  return {
    title: `Albero genealogico - ${person.firstName} ${person.lastName}`,
    description: `Visualizza l'albero genealogico di ${person.firstName} ${person.lastName}`,
  };
}

