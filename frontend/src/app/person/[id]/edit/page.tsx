import { notFound, redirect } from 'next/navigation';
import { personApi } from '@/lib/api';
import PersonForm from '@/components/PersonForm/PersonForm';
import { cookies } from 'next/headers';

interface EditPersonPageProps {
  params: {
    id: string;
  };
}

async function getPerson(id: string) {
  try {
    const response = await personApi.getById(parseInt(id));
    return response.data;
  } catch (error) {
    return null;
  }
}

export default async function EditPersonPage({ params }: EditPersonPageProps) {
  // Check authentication
  const cookieStore = await cookies();
  const token = cookieStore.get('token');
  
  if (!token) {
    redirect('/login');
  }

  const person = await getPerson(params.id);

  if (!person) {
    notFound();
  }

  return <PersonForm mode="edit" person={person} />;
}

