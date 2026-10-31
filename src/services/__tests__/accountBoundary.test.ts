import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { resolveLoginWorkspace } from '../sessionWorkspace';
import { computeEmployeePassword, getNextEmployeeId } from '../../utils/employeeCredentials';
import type { AuthUser, CompanyWorkspace } from '../../types';

const user: AuthUser = { id: 'test-user', name: 'Sample Operator', email: 'operator@example.test', companyCode: 'OAK-01', companyId: 'sample-company', companyName: 'Sample Workshop', role: 'operator', sheetAccessGranted: true, authMethod: 'credentials', loginTimestamp: '2026-10-31T00:00:00Z' };

describe('Lightweight account / existing workspace handoff', () => {
  it('selects the matching factory without changing its existing configuration', () => {
    const existing: CompanyWorkspace = { id: 'factory-oak', name: 'Existing Workshop', code: 'OAK-01', sheetId: 'existing-sheet', ownerEmail: 'owner@example.test', maxUsers: 5 };
    const result = resolveLoginWorkspace(user, 'login-sheet', [existing]);
    assert.deepEqual(result, existing);
    assert.notEqual(result, existing);
  });
  it('never chooses an unrelated cached company for a new login', () => {
    const unrelated: CompanyWorkspace = { id: 'another-factory', name: 'Other Company', code: 'OTHER', sheetId: 'other-sheet', ownerEmail: 'other@example.test' };
    const result = resolveLoginWorkspace(user, 'login-sheet', [unrelated]);
    assert.equal(result?.code, 'OAK-01');
    assert.equal(result?.id, 'sample-company');
    assert.equal(result?.sheetId, 'login-sheet');
    assert.equal(result?.isPrimary, false);
  });
  it('preserves the existing legacy company-code alias mapping', () => {
    const result = resolveLoginWorkspace({ ...user, companyCode: 'ATH-001' }, 'sample-sheet', []);
    assert.equal(result?.code, 'ATH-01');
    assert.equal(result?.name, 'Atharva Textiles');
  });
  it('does not invent a company if the login has no company code', () => {
    assert.equal(resolveLoginWorkspace({ ...user, companyCode: undefined }, 'sample-sheet', []), null);
  });
  it('preserves the extracted legacy employee helper behaviour', () => {
    assert.equal(computeEmployeePassword('', '2000-01-01'), '');
    assert.equal(computeEmployeePassword('Sample Person', '2000-03-12'), 'sample@1203');
    assert.equal(getNextEmployeeId([], 'OAK-01'), 'OAK0-001');
  });
});
