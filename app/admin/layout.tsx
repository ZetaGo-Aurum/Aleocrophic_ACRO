'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user || user.email !== 'deltaastra24@gmail.com') {
        console.warn('Unauthorized access attempt to Admin Dashboard');
        router.push('/');
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  if (!user || user.email !== 'deltaastra24@gmail.com') return null;

  return (
    <div className="min-h-screen bg-gray-900 text-white flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-800 p-6 hidden md:block border-r border-gray-700">
        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-blue-500 mb-8">
          ACRO Admin
        </h1>
        <nav className="space-y-4">
          <a href="/admin" className="block py-2 px-4 rounded hover:bg-gray-700 text-gray-300 hover:text-white transition">
            Dashboard
          </a>
          <div className="h-px bg-gray-700 my-4"></div>
          <a href="/" className="block py-2 px-4 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition text-sm">
            ← Back to Site
          </a>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
