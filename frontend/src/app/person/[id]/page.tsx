import { notFound } from 'next/navigation';
import Header from '@/components/Header/Header';
import PersonProfile from '@/components/PersonProfile/PersonProfile';
import { Person } from '@/types';
import styles from './page.module.scss';

async function getPerson(id: string): Promise<Person | null> {
  try {
    // В production используем внутренний URL (localhost), в dev - внешний
    const apiUrl = process.env.NODE_ENV === 'production'
      ? 'http://localhost:3300'
      : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3300');
    
    const response = await fetch(`${apiUrl}/api/person/${id}`, {
      cache: 'no-store', // Всегда получаем свежие данные
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

export default async function PersonPage({ params }: { params: { id: string } }) {
  const person = await getPerson(params.id);

  if (!person) {
    notFound();
  }

  return (
    <>
      <Header />
      <main className={styles.main}>
        <PersonProfile person={person} serverColor={person.primaryServer?.color || '#0ea5e9'} />
      </main>
    </>
  );
}

// Генерация метаданных для SEO
export async function generateMetadata({ params }: { params: { id: string } }) {
  const person = await getPerson(params.id);

  if (!person) {
    return {
      title: 'Persona non trovata - Albero',
    };
  }

  return {
    title: `${person.firstName} ${person.lastName} - Albero`,
    description: `Informazioni su ${person.firstName} ${person.lastName}${person.birthYear ? ` (${person.birthYear}` : ''}${person.deathYear ? ` - ${person.deathYear})` : person.birthYear ? ')' : ''}`,
  };
}

