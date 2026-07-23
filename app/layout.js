import './styles.css';
import './alerts.css';
import './macos.css';
import './suite.css';
import SuiteNav from './components/suite-nav.js';

export const metadata = {
  title: 'Token Pulse',
  description: 'Private agent telemetry, reusable operator prompts, and evidence-led growth tracking',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, title: 'Token Pulse', statusBarStyle: 'black-translucent' },
};

export default function RootLayout({ children }) {
  return <html lang="en"><body><SuiteNav />{children}</body></html>;
}
