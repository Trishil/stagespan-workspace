import type { AuthUser, CompanyWorkspace } from '../types';
import { DEFAULT_APPS_SCRIPT_URL } from './googleAuth';

/** Shared existing workspace selection; no authentication or permission decisions. */
export function resolveLoginWorkspace(user: AuthUser, sheetId: string, factories: CompanyWorkspace[]): CompanyWorkspace | null {
  if (!user.companyCode) return null;
  const norm = (code: string) => (code || '').replace(/[^A-Z0-9]/g, '').replace(/0+([0-9]+)/, '$1');
  const userCode = norm(user.companyCode);
  const isAtharva = userCode === 'ATH1' || ['ATH-001', 'ATH001', 'ATH-01'].includes(user.companyCode);
  const code = isAtharva ? 'ATH-01' : user.companyCode;
  const found = factories.find(factory => factory.code.toUpperCase() === code.toUpperCase() || norm(factory.code) === userCode || norm(factory.id) === userCode);
  if (found) return { ...found, code: isAtharva ? 'ATH-01' : found.code, name: isAtharva ? 'Atharva Textiles' : found.name };
  return {
    id: user.companyId || `factory_${code.toLowerCase()}`,
    name: isAtharva ? 'Atharva Textiles' : (user.companyName || user.companyCode),
    code, sheetId, scriptUrl: DEFAULT_APPS_SCRIPT_URL,
    isPrimary: code.toUpperCase() === 'TRISHARTH-HQ', ownerEmail: user.email || '',
  };
}
