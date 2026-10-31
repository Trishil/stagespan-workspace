import React, { lazy, Suspense, useState } from 'react';
import type { AuthUser } from '../../types';
import { getStoredAuthUser, getStoredSheetId } from '../../services/googleAuth';
import { AccountLoading, AccountShell } from './AccountShell';

const LoginPage = lazy(() => import('../../components/LoginPage').then(module => ({ default: module.LoginPage })));
const Workspace = lazy(() => import('../../App'));

class EntryErrorBoundary extends React.Component<{ children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (this.state.failed) return <AccountShell><p className="tf-account-eyebrow">CONNECTION INTERRUPTED</p><h1>A moment<br /><em>to reconnect.</em></h1><p className="tf-account-intro">The workspace could not finish loading. Your saved records have not been changed.</p><button className="tf-account-submit" style={{ marginTop: 25 }} onClick={() => window.location.reload()}>Try again</button></AccountShell>;
    return this.props.children;
  }
}

export function ProductEntry() {
  const parameters = new URLSearchParams(window.location.search);
  const requestRegistration = parameters.get('auth') === 'register' || parameters.get('experience') === 'onboarding';
  const [openWorkspace, setOpenWorkspace] = useState(() => parameters.get('auth') !== 'register' && Boolean(getStoredAuthUser()?.sheetAccessGranted));
  const [initialLogin, setInitialLogin] = useState<{ user: AuthUser; sheetId: string } | undefined>();

  const loginSucceeded = (user: AuthUser, sheetId: string) => {
    // The existing App handler persists the session and configures the factory.
    // Do not create a second authentication or registration implementation here.
    setInitialLogin({ user, sheetId });
    const url = new URL(window.location.href);
    url.searchParams.set('experience', 'workspace'); url.searchParams.delete('auth'); url.searchParams.delete('view'); url.hash = '';
    window.history.replaceState({}, '', url);
    try { localStorage.setItem('saas_experience_mode', 'workspace'); } catch { /* The app handles unavailable storage. */ }
    window.scrollTo(0, 0);
    setOpenWorkspace(true);
  };

  return <EntryErrorBoundary><Suspense fallback={<AccountLoading />}>
    {openWorkspace ? <Workspace initialLogin={initialLogin} /> : <LoginPage onLoginSuccess={loginSucceeded} initialSheetId={getStoredSheetId()} />}
  </Suspense></EntryErrorBoundary>;
}
