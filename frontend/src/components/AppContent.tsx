import { BrowserRouter } from 'react-router-dom';

interface AppContentProps {
  Component: React.ComponentType<any>;
  pageProps: any;
}

export default function AppContent({ Component, pageProps }: AppContentProps) {
  return (
    <BrowserRouter>
      <Component {...pageProps} />
    </BrowserRouter>
  );
}
