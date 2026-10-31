import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { executeStageTransition, reconcileJobQuantities, roundToPrecision, ProductionJobRecord } from '../quantityEngine';
import { validateWorkflowVersion } from '../validator';
import { TEXTILE_TEMPLATE } from '../../../templates/textile';
import { FURNITURE_TEMPLATE } from '../../../templates/furniture';
import { canPerformAction, UserMembership } from '../../permissions/types';
import { TenantEntitlements } from '../../configuration/types';

describe('Workflow Version Validation', () => {
  it('validates canonical Textile template with 10 stages', () => {
    const res = validateWorkflowVersion({
      ...TEXTILE_TEMPLATE.workflow,
      isPublished: true,
    });
    assert.equal(res.isValid, true);
    assert.equal(res.errors.length, 0);
  });

  it('validates canonical Furniture template with 5 stages and rework route', () => {
    const res = validateWorkflowVersion({
      ...FURNITURE_TEMPLATE.workflow,
      isPublished: true,
    });
    assert.equal(res.isValid, true);
    assert.equal(res.errors.length, 0);
  });

  it('detects duplicate stage IDs and invalid transition links', () => {
    const broken = {
      ...FURNITURE_TEMPLATE.workflow,
      isPublished: true,
      stages: [
        ...FURNITURE_TEMPLATE.workflow.stages,
        {
          id: 'timber_intake', // Duplicate ID
          label: 'Duplicate',
          shortName: 'Dup',
          stageKind: 'operation' as const,
          order: 99,
          color: { bg: '', border: '', text: '', badge: '', headerBg: '' },
          iconName: 'Box',
          allowedTransitionStageIds: ['non_existent_stage_id'],
        },
      ],
    };
    const res = validateWorkflowVersion(broken);
    assert.equal(res.isValid, false);
    assert.ok(res.errors.some((e) => e.includes('Duplicate stage ID')));
    assert.ok(res.errors.some((e) => e.includes('non_existent_stage_id')));
  });
});

describe('Quantity & Workflow Engine Invariants', () => {
  const furnitureWf = {
    ...FURNITURE_TEMPLATE.workflow,
    isPublished: true,
  };

  const sampleBatchJob: ProductionJobRecord = {
    id: 'job_wood_chairs_01',
    companyId: 'comp_acme',
    factoryId: 'fact_oak_01',
    jobNo: 'JOB-CHAIR-101',
    productName: 'Teak Dining Chair',
    trackingMode: 'batch_quantity',
    unit: 'kg',
    unitPrecision: 2,
    totalQuantity: 250.75,
    workflowVersionId: furnitureWf.versionId,
    currentStageId: 'timber_intake',
    stageQuantities: {
      timber_intake: 250.75,
      cutting_machining: 0,
      assembly_framing: 0,
      finishing_qc: 0,
      rework_sanding: 0,
      packing_dispatch: 0,
    },
    rejectedQuantity: 0,
    returnedQuantity: 0,
    completedQuantity: 0,
    dispatchedQuantity: 0,
    operationHistory: [],
    updatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };

  it('moves partial batch quantity accurately with decimal precision', () => {
    const cmd = {
      operationId: 'op_step_01',
      job: sampleBatchJob,
      workflow: furnitureWf,
      fromStageId: 'timber_intake',
      toStageId: 'cutting_machining',
      quantity: 100.5,
      actorEmail: 'operator@acme.com',
    };

    const res = executeStageTransition(cmd);
    assert.equal(res.success, true);
    assert.ok(res.data);
    assert.equal(res.data.stageQuantities.timber_intake, 150.25);
    assert.equal(res.data.stageQuantities.cutting_machining, 100.5);

    // Verify quantity reconciliation
    const recon = reconcileJobQuantities(res.data);
    assert.equal(recon.isBalanced, true);
    assert.equal(recon.totalAccountedFor, 250.75);
    assert.equal(recon.variance, 0);
  });

  it('rejects stage movement exceeding available source balance', () => {
    const cmd = {
      operationId: 'op_excess_01',
      job: sampleBatchJob,
      workflow: furnitureWf,
      fromStageId: 'timber_intake',
      toStageId: 'cutting_machining',
      quantity: 300.0, // Exceeds 250.75
      actorEmail: 'operator@acme.com',
    };

    const res = executeStageTransition(cmd);
    assert.equal(res.success, false);
    assert.ok(res.error?.includes('Insufficient quantity'));
  });

  it('is strictly idempotent on repeated operationId submission', () => {
    const cmd = {
      operationId: 'op_step_idem_01',
      job: sampleBatchJob,
      workflow: furnitureWf,
      fromStageId: 'timber_intake',
      toStageId: 'cutting_machining',
      quantity: 50,
      actorEmail: 'operator@acme.com',
    };

    const firstRun = executeStageTransition(cmd);
    assert.equal(firstRun.success, true);
    assert.equal(firstRun.data?.stageQuantities.cutting_machining, 50);

    // Second execution with same operationId
    const secondRun = executeStageTransition({
      ...cmd,
      job: firstRun.data!,
    });
    assert.equal(secondRun.success, true);
    // Quantity must NOT be deducted twice
    assert.equal(secondRun.data?.stageQuantities.cutting_machining, 50);
    assert.equal(secondRun.data?.stageQuantities.timber_intake, 200.75);
  });

  it('supports rework routing without inflating total quantity', () => {
    const readyForInspection: ProductionJobRecord = {
      ...sampleBatchJob,
      stageQuantities: {
        ...sampleBatchJob.stageQuantities,
        timber_intake: 0,
        finishing_qc: 250.75,
      },
    };

    const reworkCmd = {
      operationId: 'op_rework_01',
      job: readyForInspection,
      workflow: furnitureWf,
      fromStageId: 'finishing_qc',
      toStageId: 'rework_sanding', // Allowed rework route
      quantity: 25.0,
      actorEmail: 'qc@acme.com',
      defectReason: 'Surface roughness',
    };

    const res = executeStageTransition(reworkCmd);
    assert.equal(res.success, true);
    assert.equal(res.data?.stageQuantities.finishing_qc, 225.75);
    assert.equal(res.data?.stageQuantities.rework_sanding, 25.0);

    const recon = reconcileJobQuantities(res.data!);
    assert.equal(recon.isBalanced, true);
    assert.equal(recon.totalAccountedFor, 250.75);
  });
});

describe('Permission Matrix and Entitlement Guards', () => {
  const activeEntitlements: TenantEntitlements = {
    companyId: 'comp_test',
    planTier: 'growth',
    planStatus: 'active',
    allowedModules: ['workflow', 'inventory'],
    maxUsers: 10,
    maxFactories: 2,
    maxActiveJobs: 50,
    storageQuotaMb: 1024,
    updatedAt: new Date().toISOString(),
    updatedBy: 'admin',
  };

  const operatorMember: UserMembership = {
    userId: 'user_op_01',
    email: 'op@test.com',
    name: 'Operator Joe',
    companyId: 'comp_test',
    role: 'operator',
    permittedFactoryIds: ['fact_main'],
    status: 'active',
  };

  const viewerMember: UserMembership = {
    ...operatorMember,
    role: 'viewer',
  };

  it('allows operator to move workflow stage when workflow module is entitled', () => {
    const res = canPerformAction(operatorMember, activeEntitlements, 'move_workflow_stage', 'fact_main');
    assert.equal(res.allowed, true);
  });

  it('denies viewer from modifying operational state', () => {
    const res = canPerformAction(viewerMember, activeEntitlements, 'move_workflow_stage', 'fact_main');
    assert.equal(res.allowed, false);
    assert.ok(res.reason?.includes('not permitted for your role'));
  });

  it('denies action when required module is not in entitlements', () => {
    const res = canPerformAction(operatorMember, activeEntitlements, 'dispatch_order', 'fact_main');
    assert.equal(res.allowed, false);
    assert.ok(res.reason?.includes("'dispatch' module is not included"));
  });

  it('denies data entry when subscription is suspended', () => {
    const suspendedEntitlements: TenantEntitlements = {
      ...activeEntitlements,
      planStatus: 'suspended',
      suspensionReason: 'Payment delinquent',
    };
    const res = canPerformAction(operatorMember, suspendedEntitlements, 'create_job', 'fact_main');
    assert.equal(res.allowed, false);
    assert.ok(res.reason?.includes('locked because the company plan is suspended'));
  });
});

