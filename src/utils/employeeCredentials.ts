import type { EmployeeRecord } from '../types';

export function computeEmployeePassword(name: string, dob?: string): string {
  if (!name.trim()) return '';
  const firstName = name.trim().split(/\s+/)[0].toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!dob) return `${firstName}@1234`;
  const parts = dob.split('-');
  if (parts.length === 3) {
    const day = parts[2];
    const month = parts[1];
    return `${firstName}@${day}${month}`;
  }
  return `${firstName}@1234`;
}

export function getNextEmployeeId(existingEmployees: EmployeeRecord[], factoryCode?: string): string {
  let cleanCode = (factoryCode || '').trim().toUpperCase();
  if (!cleanCode) {
    try {
      const active = localStorage.getItem('active_factory_workspace');
      if (active) cleanCode = (JSON.parse(active).code || 'TRISHARTH-HQ').trim().toUpperCase();
    } catch {}
  }
  if (!cleanCode) cleanCode = 'TRISHARTH-HQ';

  const prefix = cleanCode === 'TRISHARTH-HQ' || cleanCode === 'TRISHARTH'
    ? 'TR'
    : cleanCode.replace(/[^A-Z0-9]/g, '').slice(0, 4);

  const prefixRegex = new RegExp(`^${prefix}-(\\d+)`, 'i');
  let maxNum = 0;
  for (const emp of existingEmployees) {
    const raw = emp.employeeId || emp.employeeCode || '';
    const match = raw.match(prefixRegex) || raw.match(/EMP-(\d+)/i) || (prefix === 'TR' ? raw.match(/TR-(\d+)/i) : null);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNum) maxNum = num;
    }
  }
  const nextNum = maxNum > 0 ? maxNum + 1 : (existingEmployees.length + 1);
  return `${prefix}-${String(nextNum).padStart(3, '0')}`;
}
