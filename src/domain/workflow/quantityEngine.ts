/**
 * Authoritative Quantity & Workflow Movement Engine
 * Enforces domain invariants for both unit-tracked and batch-quantity jobs.
 */

import { WorkflowVersion } from '../configuration/types';

export interface StageBalance {
  stageId: string;
  quantity: number;
}

export interface ProductionJobRecord {
  id: string;
  companyId: string;
  factoryId: string;
  jobNo: string;
  productName: string;
  trackingMode: 'pieces' | 'batch_quantity';
  unit: string;
  unitPrecision: number;
  totalQuantity: number;
  workflowVersionId: string;
  currentStageId: string;
  stageQuantities: Record<string, number>; // stageId -> quantity in stage
  rejectedQuantity: number;
  returnedQuantity: number;
  completedQuantity: number;
  dispatchedQuantity: number;
  customFieldValues?: Record<string, any>;
  operationHistory: WorkflowOperationEvent[];
  updatedAt: string;
  createdAt: string;
}

export interface WorkflowOperationEvent {
  operationId: string; // Idempotency key
  timestamp: string;
  actorEmail: string;
  action: 'intake' | 'advance' | 'rework' | 'reject' | 'return_supplier' | 'complete' | 'dispatch';
  fromStageId?: string;
  toStageId?: string;
  quantity: number;
  notes?: string;
  defectReason?: string;
  unitIds?: string[];
}

export interface TransitionCommand {
  operationId: string;
  job: ProductionJobRecord;
  workflow: WorkflowVersion;
  fromStageId: string;
  toStageId: string;
  quantity: number;
  actorEmail: string;
  defectReason?: string;
  notes?: string;
}

export interface CommandResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Rounds a quantity safely to the unit's configured decimal precision, avoiding IEEE-754 floating-point drift.
 */
export function roundToPrecision(val: number, precision: number = 0): number {
  const factor = Math.pow(10, Math.max(0, precision));
  return Math.round((val + Number.EPSILON) * factor) / factor;
}

/**
 * Validates and executes a stage transition in batch or piece mode.
 * Enforces:
 * 1. Idempotency (re-running same operationId returns existing state without mutation).
 * 2. Non-negative source balances.
 * 3. Moving quantity cannot exceed available quantity in fromStage.
 * 4. Allowed transition paths from the workflow definition.
 * 5. Conservation of mass / units.
 */
export function executeStageTransition(cmd: TransitionCommand): CommandResult<ProductionJobRecord> {
  const { operationId, job, workflow, fromStageId, toStageId, quantity, actorEmail, defectReason, notes } = cmd;

  // 1. Idempotency Check
  const existingEvent = job.operationHistory.find((ev) => ev.operationId === operationId);
  if (existingEvent) {
    return { success: true, data: job };
  }

  // 2. Validate quantity
  const precision = job.unitPrecision ?? 0;
  const cleanQty = roundToPrecision(quantity, precision);
  if (cleanQty <= 0) {
    return { success: false, error: 'Transition quantity must be strictly greater than zero.' };
  }

  // 3. Validate stages exist
  const fromStage = workflow.stages.find((s) => s.id === fromStageId);
  const toStage = workflow.stages.find((s) => s.id === toStageId);
  if (!fromStage) {
    return { success: false, error: `Source stage "${fromStageId}" does not exist in workflow ${workflow.versionId}.` };
  }
  if (!toStage) {
    return { success: false, error: `Destination stage "${toStageId}" does not exist in workflow ${workflow.versionId}.` };
  }

  // 4. Validate transition is permitted
  const isDirectlyAllowed = Array.isArray(fromStage.allowedTransitionStageIds) && fromStage.allowedTransitionStageIds.includes(toStageId);
  const isReworkRouting = fromStage.reworkStageId === toStageId;
  if (!isDirectlyAllowed && !isReworkRouting) {
    return {
      success: false,
      error: `Transition from "${fromStage.label}" to "${toStage.label}" is not permitted by workflow rules.`,
    };
  }

  // 5. Source stage balance check
  const currentSourceQty = roundToPrecision(job.stageQuantities[fromStageId] || 0, precision);
  if (currentSourceQty < cleanQty) {
    return {
      success: false,
      error: `Insufficient quantity in "${fromStage.label}". Available: ${currentSourceQty} ${job.unit}, Requested: ${cleanQty} ${job.unit}.`,
    };
  }

  // 6. Execute atomic balance transfer
  const updatedStageQuantities: Record<string, number> = { ...job.stageQuantities };
  updatedStageQuantities[fromStageId] = roundToPrecision(currentSourceQty - cleanQty, precision);
  const currentDestQty = roundToPrecision(updatedStageQuantities[toStageId] || 0, precision);
  updatedStageQuantities[toStageId] = roundToPrecision(currentDestQty + cleanQty, precision);

  // If destination is completion stage
  let completedQuantity = job.completedQuantity || 0;
  if (toStage.isTerminalCompletion || toStage.id === workflow.completionStageId) {
    completedQuantity = roundToPrecision(completedQuantity + cleanQty, precision);
  }

  const newEvent: WorkflowOperationEvent = {
    operationId,
    timestamp: new Date().toISOString(),
    actorEmail,
    action: isReworkRouting ? 'rework' : 'advance',
    fromStageId,
    toStageId,
    quantity: cleanQty,
    notes,
    defectReason,
  };

  const updatedJob: ProductionJobRecord = {
    ...job,
    currentStageId: toStageId,
    stageQuantities: updatedStageQuantities,
    completedQuantity,
    operationHistory: [newEvent, ...job.operationHistory],
    updatedAt: new Date().toISOString(),
  };

  return { success: true, data: updatedJob };
}

/**
 * Reconciles and verifies the invariant that total active quantities across all stages,
 * plus rejected, returned, and dispatched quantities exactly equals the initial total job quantity.
 */
export function reconcileJobQuantities(job: ProductionJobRecord): {
  isBalanced: boolean;
  totalAccountedFor: number;
  expectedTotal: number;
  variance: number;
} {
  const precision = job.unitPrecision ?? 0;
  const stageTotal = Object.values(job.stageQuantities).reduce((acc, q) => acc + (q || 0), 0);
  const totalAccountedFor = roundToPrecision(
    stageTotal + (job.rejectedQuantity || 0) + (job.returnedQuantity || 0) + (job.dispatchedQuantity || 0),
    precision
  );
  const expectedTotal = roundToPrecision(job.totalQuantity, precision);
  const variance = roundToPrecision(totalAccountedFor - expectedTotal, precision);

  return {
    isBalanced: Math.abs(variance) === 0,
    totalAccountedFor,
    expectedTotal,
    variance,
  };
}

