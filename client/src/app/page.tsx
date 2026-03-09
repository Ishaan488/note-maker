import { redirect } from 'next/navigation';

export default function Home() {
  // Simple redirect to feed for authenticated users, 
  // or middleware will catch and send to /login
  redirect('/login');
}
