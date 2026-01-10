import 'reactflow/dist/style.css';
import './globals.css';

export const metadata = {
  title: 'Flow Builder',
  description: 'A visual programming interface',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}