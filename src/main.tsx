import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ProductEntry } from './features/account/ProductEntry';
import { BROCHURE_URL } from './config/experienceUrls';
import './index.css';

const parameters = new URLSearchParams(window.location.search);
const oldExperience = parameters.get('experience') || parameters.get('view');
if (oldExperience === 'public' || oldExperience === 'story') {
  // Legacy pitch links redirect without importing the ERP or starting its services.
  window.location.replace(BROCHURE_URL + window.location.hash);
} else {
  createRoot(document.getElementById('root')!).render(<StrictMode><ProductEntry /></StrictMode>);
}
