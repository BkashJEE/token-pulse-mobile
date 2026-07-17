import './styles.css';

export const metadata = {
  title: 'Token Pulse Mobile',
  description: 'Private live AI runtime and token monitoring',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, title: 'Token Pulse', statusBarStyle: 'black-translucent' },
};

export default function RootLayout({ children }) {
  return <html lang="en"><body>{children}</body></html>;
}
