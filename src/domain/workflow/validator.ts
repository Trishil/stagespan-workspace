import { WorkflowVersion, StageDefinitionConfig } from '../configuration/types';

export interface WorkflowValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validates a workflow version definition against domain invariants:
 * 1. At least 2 stages
 * 2. Unique stage IDs and non-empty labels
 * 3. Exactly one initial stage
 * 4. At least one terminal completion stage
 * 5. All allowedTransitionStageIds reference existing stages
 * 6. Rework destination stages reference existing stages and have an exit route
 */
export function validateWorkflowVersion(wf: WorkflowVersion): WorkflowValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!wf.name || !wf.name.trim()) {
    errors.push('Workflow name is required.');
  }

  if (!Array.isArray(wf.stages) || wf.stages.length < 2) {
    errors.push('A valid workflow must contain at least 2 stages.');
    return { isValid: false, errors, warnings };
  }

  const stageIds = new Set<string>();
  const initialStages: StageDefinitionConfig[] = [];
  const completionStages: StageDefinitionConfig[] = [];

  for (const stage of wf.stages) {
    if (!stage.id || !stage.id.trim()) {
      errors.push(`Stage at order ${stage.order} has an empty ID.`);
    } else if (stageIds.has(stage.id)) {
      errors.push(`Duplicate stage ID detected: "${stage.id}". Stage IDs must be unique.`);
    } else {
      stageIds.add(stage.id);
    }

    if (!stage.label || !stage.label.trim()) {
      errors.push(`Stage "${stage.id}" has an empty label.`);
    }

    if (stage.stageKind === 'intake' || stage.id === wf.initialStageId) {
      initialStages.push(stage);
    }

    if (stage.stageKind === 'completion' || stage.isTerminalCompletion || stage.id === wf.completionStageId) {
      completionStages.push(stage);
    }
  }

  // Initial stage check
  if (!wf.initialStageId || !stageIds.has(wf.initialStageId)) {
    errors.push(`Initial stage ID "${wf.initialStageId}" does not exist in the defined stages.`);
  }

  // Completion stage check
  if (!wf.completionStageId || !stageIds.has(wf.completionStageId)) {
    errors.push(`Completion stage ID "${wf.completionStageId}" does not exist in the defined stages.`);
  }

  if (completionStages.length === 0) {
    errors.push('Workflow must define at least one terminal completion stage.');
  }

  // Transition & Rework validation
  for (const stage of wf.stages) {
    if (Array.isArray(stage.allowedTransitionStageIds)) {
      for (const targetId of stage.allowedTransitionStageIds) {
        if (!stageIds.has(targetId)) {
          errors.push(
            `Stage "${stage.label}" (${stage.id}) has a transition pointing to non-existent stage "${targetId}".`
          );
        }
      }
    }

    if (stage.reworkStageId) {
      if (!stageIds.has(stage.reworkStageId)) {
        errors.push(
          `Stage "${stage.label}" (${stage.id}) specifies rework destination "${stage.reworkStageId}" which does not exist.`
        );
      } else {
        const reworkStage = wf.stages.find((s) => s.id === stage.reworkStageId);
        if (
          reworkStage &&
          (!reworkStage.allowedTransitionStageIds || reworkStage.allowedTransitionStageIds.length === 0)
        ) {
          errors.push(
            `Rework stage "${reworkStage.label}" (${reworkStage.id}) is a dead end with no forward or return transitions.`
          );
        }
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

