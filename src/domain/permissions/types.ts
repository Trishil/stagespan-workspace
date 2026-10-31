/**
 * Permissions and Access Control Matrix for Configurable SaaS
 */

import { ModuleId, TenantEntitlements } from '../configuration/types';

export type UserRole = 'super_admin' | 'company_owner' | 'factory_admin' | 'operator' | 'viewer';

export type PermissionAction =
  | 'manage_platform_tenants'
  | 'manage_company_subscription'
  | 'manage_members'
  | 'publish_configuration'
  | 'edit_configuration_draft'
  | 'create_job'
  | 'move_workflow_stage'
  | 'inspect_workflow'
  | 'adjust_inventory'
  | 'record_stock_consumption'
  | 'dispatch_order'
  | 'view_finance'
  | 'manage_finance'
  | 'view_operations';

export interface UserMembership {
  userId: string;
  email: string;
  name: string;
  companyId: string;
  role: UserRole;
  permittedFactoryIds: string[]; // ['*'] for all factories
  financialAccess?: boolean;
  webAccess?: boolean;
  mobileAccess?: boolean;
  permittedModules?: ModuleId[];
  employeeCode?: string;
  status: 'active' | 'invited' | 'disabled';
}

/**
 * Checks whether a given role has the structural permission to execute an action.
 */
export function hasRolePermission(role: UserRole, action: PermissionAction): boolean {
  switch (role) {
    case 'super_admin':
      return true;

    case 'company_owner':
      return action !== 'manage_platform_tenants';

    case 'factory_admin':
      return [
        'manage_members',
        'publish_configuration',
        'edit_configuration_draft',
        'create_job',
        'move_workflow_stage',
        'inspect_workflow',
        'adjust_inventory',
        'record_stock_consumption',
        'dispatch_order',
        'view_operations',
      ].includes(action);

    case 'operator':
      return [
        'create_job',
        'move_workflow_stage',
        'inspect_workflow',
        'adjust_inventory',
        'record_stock_consumption',
        'dispatch_order',
        'view_operations',
      ].includes(action);

    case 'viewer':
      return action === 'view_operations';

    default:
      return false;
  }
}

/**
 * Evaluates full runtime entitlement and permission:
 * 1. Action structurally allowed by role
 * 2. Required module is enabled in subscription entitlements
 * 3. Subscription is active or in trial (not suspended/expired for write actions)
 */
export function canPerformAction(
  membership: UserMembership | null,
  entitlements: TenantEntitlements | null,
  action: PermissionAction,
  targetFactoryId?: string
): { allowed: boolean; reason?: string } {
  if (!membership) {
    return { allowed: false, reason: 'Unauthenticated or missing company membership.' };
  }

  // Super admin can inspect and manage anything
  if (membership.role === 'super_admin') {
    return { allowed: true };
  }

  // Check factory scope
  if (
    targetFactoryId &&
    membership.role !== 'company_owner' &&
    !membership.permittedFactoryIds.includes('*') &&
    !membership.permittedFactoryIds.includes(targetFactoryId)
  ) {
    return { allowed: false, reason: 'You do not have access to this specific factory location.' };
  }

  // Check role permission
  if (!hasRolePermission(membership.role, action)) {
    return { allowed: false, reason: `Action '${action}' is not permitted for your role (${membership.role}).` };
  }

  // Check subscription status
  if (entitlements) {
    const isWriteAction = action !== 'view_operations' && action !== 'view_finance';
    if (isWriteAction && (entitlements.planStatus === 'suspended' || entitlements.planStatus === 'expired')) {
      return {
        allowed: false,
        reason: `Workspace data entry is locked because the company plan is ${entitlements.planStatus}.`,
      };
    }

    // Module-level entitlement checks
    const moduleRequirements: Partial<Record<PermissionAction, ModuleId>> = {
      create_job: 'workflow',
      move_workflow_stage: 'workflow',
      inspect_workflow: 'workflow',
      adjust_inventory: 'inventory',
      record_stock_consumption: 'inventory',
      dispatch_order: 'dispatch',
      view_finance: 'finance',
      manage_finance: 'finance',
    };

    const requiredModule = moduleRequirements[action];
    if (requiredModule && !entitlements.allowedModules.includes(requiredModule)) {
      return {
        allowed: false,
        reason: `The '${requiredModule}' module is not included in your active subscription tier.`,
      };
    }
  }

  return { allowed: true };
}

