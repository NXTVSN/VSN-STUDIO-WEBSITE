import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import SeoLanding from './SeoLanding.tsx';
import ThankYou from './ThankYou.tsx';
import PrivacyPolicy from './PrivacyPolicy.tsx';
import TermsOfService from './TermsOfService.tsx';
import './index.css';

const path = window.location.pathname;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {path === '/campaign' ? <SeoLanding /> : 
     path.startsWith('/thank-you') ? <ThankYou /> : 
     path === '/privacy-policy' ? <PrivacyPolicy /> : 
     path === '/terms' ? <TermsOfService /> : 
     <App />}
  </StrictMode>,
);
