import { notFound } from 'next/navigation';
import { unstable_noStore as noStore } from 'next/cache';
import Header from '@/components/Header/Header';
import PersonProfile from '@/components/PersonProfile/PersonProfile';
import { Person } from '@/types';
import styles from './page.module.scss';

// Делаем страницу полностью динамической (не кешируем)
export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getPerson(id: string, host?: string): Promise<Person | null> {
  // Отключаем кеширование на уровне Next.js
  noStore();
  
  try {
    // В production используем внутренний URL (localhost), в dev - внешний
    const apiUrl = process.env.NODE_ENV === 'production'
      ? 'http://localhost:3300'
      : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3300');
    
    const headers: HeadersInit = {};
    
    // Передаем кастомный заголовок для определения сервера в API
    // (заголовок Host не работает с Node.js fetch)
    if (host) {
      headers['X-Server-Host'] = host;
    }
    
    const response = await fetch(`${apiUrl}/api/person/${id}`, {
      cache: 'no-store', // Не кешируем
      headers,
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

export default async function PersonPage({ 
  params 
}: { 
  params: { id: string } 
}) {
  // Получаем host из headers (Next.js 15+)
  const { headers } = await import('next/headers');
  const headersList = headers();
  const host = headersList.get('host') || undefined;
  
  const person = await getPerson(params.id, host);

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
  // Получаем host из headers
  const { headers } = await import('next/headers');
  const headersList = headers();
  const host = headersList.get('host') || undefined;
  
  const person = await getPerson(params.id, host);

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

