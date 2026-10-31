import React from 'react';
import { ArrowLeft } from 'lucide-react';
import './AccountShell.css';

import { BROCHURE_URL } from '../../config/experienceUrls';

export function AccountShell({ children, mode = 'login' }: { children: React.ReactNode; mode?: 'login' | 'signup' | 'loading' }) {
  return <div className="tf-account">
    <aside className="tf-account-aside">
      <img className="tf-account-photo" src={`${import.meta.env.BASE_URL}assets/story/optimized/hero-gold-thread.webp`} alt="" width="1672" height="941" />
      <a className="tf-account-brand" href={BROCHURE_URL} aria-label="Textflow website"><span className="tf-account-mark" aria-hidden="true"><i /><i /><i /></span><span>TEXTFLOW<small>BY TRISHARTH</small></span></a>
      <div className="tf-account-message"><span>THE WORKSPACE BEHIND THE WORK</span><h2>{mode === 'signup' ? <>Your process.<br /><em>A place to grow.</em></> : <>Good work.<br /><em>A clearer view.</em></>}</h2><p>Your stages, materials and orders.<br />Thoughtfully connected.</p></div>
      <div className="tf-account-aside-footer"><span>CRAFT & CLARITY</span><span>EST. IN SURAT</span></div>
    </aside>
    <main className="tf-account-main">
      <a className="tf-account-back" href={BROCHURE_URL}><ArrowLeft size={14} /> Back to Textflow</a>
      <div className="tf-account-form-wrap">{children}</div>
      <footer className="tf-account-footer">© {new Date().getFullYear()} Trisharth<span>Your factory. Your way of working.</span></footer>
    </main>
  </div>;
}

export function AccountLoading() {
  return <AccountShell mode="loading"><p className="tf-account-eyebrow">TEXTFLOW WORKSPACE</p><h1>Opening your<br /><em>workspace.</em></h1><p className="tf-account-intro" role="status">Preparing the tools for your next stage.</p><div className="tf-account-loading" aria-hidden="true" /></AccountShell>;
}
