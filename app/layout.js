import './globals.css';
import { Plus_Jakarta_Sans } from 'next/font/google';
import Script from 'next/script';

const plusJakartaSans = Plus_Jakarta_Sans({ 
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-plus-jakarta',
});

export const metadata = {
  title: 'Aleocrophic Payments | Premium Access',
  description: 'Official ACRON Payment Gateway for Aleocrophic Modded Ubuntu. Secure, fast, and exclusive for elites.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" className={`${plusJakartaSans.variable}`}>
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      </head>
      <body className="min-h-screen selection:bg-[#d0bcff] selection:text-[#121212] overflow-x-hidden font-sans">
        {children}
        <Script src="https://cdn.jsdelivr.net/npm/sweetalert2@11" strategy="beforeInteractive" />
        <Script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js" strategy="lazyOnload" />
      </body>
    </html>
  );
}
