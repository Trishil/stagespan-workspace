/**
 * Legacy Adapter & Migration Tool
 * Safely migrates single-tenant legacy records (workflow_designs, order_slips)
 * into canonical multi-tenant schema (CompanyRecord, FactoryConfiguration, ProductionJobRecord).
 * 
 * Supports dry-run parity analysis and conservation-of-units verification without live destructive writes.
 */

import { WorkflowItem, OrderSlip, EmployeeRecord } from '../../types';
import { 
  FactoryConfiguration, 
  TenantEntitlements
} from '../../domain/configuration/types';
import { CompanyRecord } from '../repositories/tenantRepository';
import { TEXTILE_TEMPLATE } from '../../templates/textile';
import { instantiateTemplateConfiguration } from '../../templates/registry';
import { reconcileJobQuantities, ProductionJobRecord } from '../../domain/workflow/quantityEngine';

export interface LegacyMigrationSnapshot {
  factoryCode: string;
  companyName: string;
  ownerEmail: string;
  workflowItems: WorkflowItem[];
  orderSlips: OrderSlip[];
  employees?: EmployeeRecord[];
}

export interface MigrationParityReport {
  timestamp: string;
  companyId: string;
  factoryCode: string;
  dryRun: boolean;
  totalLegacySlips: number;
  totalLegacyItems: number;
  totalLegacyPieces: number;
  totalMigratedJobs: number;
  totalMigratedPieces: number;
  quantityParityExact: boolean;
  orphanedLotsCount: number;
  orphanedLots: string[];
  stagesMapped: { [stageId: string]: number };
  discrepancies: string[];
}

export interface MigrationResult {
  report: MigrationParityReport;
  company: CompanyRecord;
  entitlements: TenantEntitlements;
  configuration: FactoryConfiguration;
  jobs: ProductionJobRecord[];
}

/**
 * Execute dry-run or staged migration of legacy data
 */
export function migrateLegacyFactoryData(
  snapshot: LegacyMigrationSnapshot,
  options: { dryRun?: boolean; targetCompanyId?: string } = { dryRun: true }
): MigrationResult {
  const dryRun = options.dryRun !== false;
  const companyId = options.targetCompanyId || `comp-${snapshot.factoryCode.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
  const factoryId = `fact-${snapshot.factoryCode.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
  const now = new Date().toISOString();

  // 1. Generate canonical FactoryConfiguration using canonical Textile template
  const configuration = instantiateTemplateConfiguration(
    TEXTILE_TEMPLATE,
    companyId,
    factoryId,
    snapshot.companyName,
    snapshot.factoryCode,
    snapshot.ownerEmail
  );

  const activeWorkflow = configuration.workflowVersions.find(w => w.versionId === configuration.activeWorkflowVersionId) || configuration.workflowVersions[0];

  // 2. Generate Company Record
  const company: CompanyRecord = {
    id: companyId,
    name: snapshot.companyName,
    code: snapshot.factoryCode.toUpperCase(),
    ownerEmail: snapshot.ownerEmail,
    createdAt: now,
    updatedAt: now
  };

  // 3. Generate Tenant Entitlements
  const entitlements: TenantEntitlements = {
    companyId,
    planTier: 'growth',
    planStatus: 'active',
    allowedModules: ['workflow', 'inventory', 'dispatch', 'finance', 'machines'],
    maxUsers: 50,
    maxFactories: 5,
    maxActiveJobs: 2000,
    storageQuotaMb: 25000,
    updatedAt: now,
    updatedBy: 'migration-tool'
  };

  // 4. Map legacy order slips and workflow items into ProductionJobRecords
  const jobs: ProductionJobRecord[] = [];
  const slipJobMap = new Map<string, OrderSlip>();
  snapshot.orderSlips.forEach(s => {
    slipJobMap.set(s.id, s);
    if (s.jobNo) slipJobMap.set(s.jobNo.toLowerCase(), s);
  });

  const discrepancies: string[] = [];
  const orphanedLots: string[] = [];
  const stagesMapped: { [stageId: string]: number } = {};
  let totalLegacyPieces = 0;
  let totalMigratedPieces = 0;

  // Track stages
  activeWorkflow.stages.forEach(st => {
    stagesMapped[st.id] = 0;
  });

  snapshot.workflowItems.forEach(item => {
    const qty = Number(item.quantity) || 0;
    totalLegacyPieces += qty;

    const parentSlip = item.orderSlipId ? slipJobMap.get(item.orderSlipId) : (item.jobNo ? slipJobMap.get(item.jobNo.toLowerCase()) : undefined);
    if (!parentSlip) {
      orphanedLots.push(item.lotNumber || item.id);
    }

    // Map stage to canonical stage
    let canonicalStageId: string = item.currentStage || 'fabric';
    const knownStage = activeWorkflow.stages.find(s => s.id === canonicalStageId);
    if (!knownStage) {
      discrepancies.push(`Unknown stage "${canonicalStageId}" on item "${item.id}", falling back to intake stage`);
      canonicalStageId = activeWorkflow.initialStageId;
    }

    stagesMapped[canonicalStageId] = (stagesMapped[canonicalStageId] || 0) + qty;

    const stageQuantities: Record<string, number> = {};
    activeWorkflow.stages.forEach(st => {
      stageQuantities[st.id] = 0;
    });
    stageQuantities[canonicalStageId] = qty;

    const jobRecord: ProductionJobRecord = {
      id: item.id || `job-${item.lotNumber || Date.now()}`,
      companyId,
      factoryId,
      jobNo: item.lotNumber || `LOT-${item.id}`,
      productName: item.designName || item.designNumber || 'Textile Design',
      trackingMode: 'pieces',
      unit: item.unit || 'pieces',
      unitPrecision: 0,
      totalQuantity: qty,
      workflowVersionId: activeWorkflow.versionId,
      currentStageId: canonicalStageId,
      stageQuantities,
      rejectedQuantity: 0,
      returnedQuantity: 0,
      completedQuantity: canonicalStageId === activeWorkflow.completionStageId ? qty : 0,
      dispatchedQuantity: 0,
      customFieldValues: {
        fabricType: item.fabricType || 'Silk Georgette',
        fabricColor: item.fabricColor || 'Standard',
        designNumber: item.designNumber || '',
        clientName: item.partyOrClientName || (item as any).clientName || 'General Client',
        chalanNumber: item.chalanNumber || '',
        ...((item as any).splitFromLotNumber ? { splitFromLotNumber: (item as any).splitFromLotNumber } : {})
      },
      operationHistory: [],
      createdAt: item.createdDate || now,
      updatedAt: now
    };

    // Verify conservation of mass / units on migrated job
    const recon = reconcileJobQuantities(jobRecord);
    if (!recon.isBalanced) {
      discrepancies.push(`Job ${jobRecord.jobNo} quantity imbalance: total=${qty}, accounted=${recon.totalAccountedFor}`);
    }

    jobs.push(jobRecord);
    totalMigratedPieces += qty;
  });

  const quantityParityExact = totalLegacyPieces === totalMigratedPieces && discrepancies.length === 0;

  const report: MigrationParityReport = {
    timestamp: now,
    companyId,
    factoryCode: snapshot.factoryCode,
    dryRun,
    totalLegacySlips: snapshot.orderSlips.length,
    totalLegacyItems: snapshot.workflowItems.length,
    totalLegacyPieces,
    totalMigratedJobs: jobs.length,
    totalMigratedPieces,
    quantityParityExact,
    orphanedLotsCount: orphanedLots.length,
    orphanedLots,
    stagesMapped,
    discrepancies
  };

  return {
    report,
    company,
    entitlements,
    configuration,
    jobs
  };
}
