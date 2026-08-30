import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'CheckFly — Suivi licences & contrôles 737NG',
  description: "Suivi des licences, contrôles simulateur, contrôles en ligne et niveau d'anglais des pilotes 737NG"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-screen text-gray-900">
        <header className="bg-brand-700 text-white shadow-sm">
          <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 font-semibold text-lg">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-brand-700 font-bold">
                CF
              </span>
              CheckFly <span className="hidden sm:inline text-brand-100 font-normal">— Fleet Training 737NG</span>
            </Link>
            <nav className="flex items-center gap-1 text-sm font-medium">
              <Link href="/" className="rounded-md px-3 py-2 hover:bg-brand-600 transition-colors">
                Tableau de bord
              </Link>
              <Link href="/pilots" className="rounded-md px-3 py-2 hover:bg-brand-600 transition-colors">
                Pilotes
              </Link>
              <Link
                href="/pilots/new"
                className="ml-2 rounded-md bg-white px-3 py-2 text-brand-700 hover:bg-brand-50 transition-colors"
              >
                + Ajouter un pilote
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
