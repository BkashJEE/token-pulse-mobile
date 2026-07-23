import './styles.css';
import './macos.css';

export const metadata = {
  title: 'X Growth · @BkashJosi',
  description: 'Private mobile X growth command center',
  manifest: '/growth.webmanifest',
  icons: { icon: '/x-growth-icon.png', apple: '/x-growth-icon.png' },
  appleWebApp: { capable: true, title: 'X Growth', statusBarStyle: 'black-translucent' },
};

export default function GrowthLayout({ children }) {
  return children;
}
