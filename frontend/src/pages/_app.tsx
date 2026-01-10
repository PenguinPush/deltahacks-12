import type { AppProps } from 'next/app';
import { BrowserRouter } from 'react-router-dom';
import '@/index.css';

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <BrowserRouter>
      <Component {...pageProps} />
    </BrowserRouter>
  );
}
