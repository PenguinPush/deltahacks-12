import type { AppProps } from 'next/app';
import dynamic from 'next/dynamic';
import '@/index.css';

// Disable SSR for the entire app to avoid BrowserRouter issues
const AppContent = dynamic(
  () => import('@/components/AppContent'),
  { ssr: false }
);

export default function MyApp({ Component, pageProps }: AppProps) {
  return <AppContent Component={Component} pageProps={pageProps} />;
}
