/**
 * Core Domain Types: Configurable Factory Management SaaS
 * Defines tenant configuration, immutable workflow versions, custom fields, units, and entitlements.
 */

export type ModuleId = 'workflow' | 'inventory' | 'dispatch' | 'finance' | 'machines';

export type StageKind = 'intake' | 'operation' | 'inspection' | 'rework' | 'completion';

export interface StageDefinitionConfig {
  id: string; // Stable immutable stage ID (e.g. 'cutting', 'embroidery')
  label: string; // Human editable label (e.g. '1. Cutting Department')
  shortName: string; // Compact abbreviation
  description?: string;
  stageKind: StageKind;
  order: number;
  color: {
    bg: string;
    border: string;
    text: string;
    badge: string;
    headerBg: string;
  };
  iconName: string;
  allowedTransitionStageIds: string[]; // Explicit allowed next stages
  reworkStageId?: string; // If inspection fails, which rework stage receives the batch/item?
  isTerminalCompletion?: boolean; // Handover to dispatch / finished goods
}

export interface WorkflowVersion {
  workflowId: string;
  versionId: string; // Unique immutable version ID (e.g. 'wf-textile-v1')
  versionNumber: number;
  name: string;
  description?: string;
  stages: StageDefinitionConfig[];
  initialStageId: string;
  completionStageId: string;
  customFieldSchemaVersionId?: string;
  isPublished: boolean;
  publishedAt?: string;
  publishedBy?: string;
  checksum?: string;
}

export type UnitDimension = 'count' | 'mass' | 'length' | 'volume';

export interface UnitDefinition {
  id: string;
  label: string;
  symbol: string;
  dimension: UnitDimension;
  precision: number; // e.g. 0 for pcs, 2 for kg/meters
  isDefault?: boolean;
}

export type CustomFieldInputType = 'text' | 'number' | 'date' | 'dropdown' | 'checkbox';

export interface FieldDefinition {
  id: string;
  label: string;
  entityType: 'job' | 'material' | 'unit';
  inputType: CustomFieldInputType;
  required: boolean;
  options?: string[]; // For dropdown
  defaultValue?: string | number | boolean;
  placeholder?: string;
  description?: string;
  isRetired?: boolean;
}

export interface FactoryConfiguration {
  schemaVersion: '1.0.0';
  companyId: string;
  factoryId: string;
  factoryName: string;
  factoryCode: string;
  timezone: string;
  currency: string;
  enabledModules: ModuleId[];
  activeWorkflowVersionId: string;
  workflowVersions: WorkflowVersion[];
  units: UnitDefinition[];
  categories: string[];
  locations: string[];
  customFields: FieldDefinition[];
  status: 'draft' | 'published';
  updatedAt: string;
  updatedBy: string;
}

export type PlanTier = 'trial' | 'starter' | 'growth' | 'enterprise';
export type PlanStatus = 'active' | 'trial' | 'suspended' | 'expired';

export interface TenantEntitlements {
  companyId: string;
  planTier: PlanTier;
  planStatus: PlanStatus;
  allowedModules: ModuleId[];
  maxUsers: number;
  maxFactories: number;
  maxActiveJobs: number;
  storageQuotaMb: number;
  trialExpiresAt?: string;
  suspensionReason?: string;
  isManualBilling?: boolean;
  updatedAt: string;
  updatedBy: string;
}

export interface FactoryTemplate {
  id: string;
  name: string;
  industry: string;
  description: string;
  defaultTrackingMode: 'pieces' | 'batch_quantity';
  enabledModules: ModuleId[];
  units: UnitDefinition[];
  categories: string[];
  locations: string[];
  customFields: FieldDefinition[];
  workflow: Omit<WorkflowVersion, 'isPublished' | 'publishedAt' | 'publishedBy'>;
}

