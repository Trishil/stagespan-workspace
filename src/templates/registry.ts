import { FactoryConfiguration, FactoryTemplate, WorkflowVersion } from '../domain/configuration/types';
import { TEXTILE_TEMPLATE } from './textile';
import { FURNITURE_TEMPLATE } from './furniture';
import { BLANK_TEMPLATE } from './blank';

export const ALL_FACTORY_TEMPLATES: FactoryTemplate[] = [
  TEXTILE_TEMPLATE,
  FURNITURE_TEMPLATE,
  BLANK_TEMPLATE,
];

export function findTemplateById(templateId: string): FactoryTemplate {
  const match = ALL_FACTORY_TEMPLATES.find((t) => t.id === templateId);
  return match || BLANK_TEMPLATE;
}

/**
 * Clones a template into an isolated, independent FactoryConfiguration for a specific company & factory.
 * Guarantees that editing the customer's configuration NEVER mutates the template or another customer.
 */
export function instantiateTemplateConfiguration(
  template: FactoryTemplate,
  companyId: string,
  factoryId: string,
  factoryName: string,
  factoryCode: string,
  actorEmail: string = 'system'
): FactoryConfiguration {
  const deepClonedTemplate: FactoryTemplate = JSON.parse(JSON.stringify(template));
  const versionId = `v1_${Date.now()}`;
  const workflowId = `wf_${factoryId}`;

  const publishedWorkflow: WorkflowVersion = {
    ...deepClonedTemplate.workflow,
    workflowId,
    versionId,
    versionNumber: 1,
    isPublished: true,
    publishedAt: new Date().toISOString(),
    publishedBy: actorEmail,
  };

  return {
    schemaVersion: '1.0.0',
    companyId,
    factoryId,
    factoryName,
    factoryCode,
    timezone: 'Asia/Kolkata',
    currency: 'INR',
    enabledModules: [...deepClonedTemplate.enabledModules],
    activeWorkflowVersionId: versionId,
    workflowVersions: [publishedWorkflow],
    units: [...deepClonedTemplate.units],
    categories: [...deepClonedTemplate.categories],
    locations: [...deepClonedTemplate.locations],
    customFields: [...deepClonedTemplate.customFields],
    status: 'published',
    updatedAt: new Date().toISOString(),
    updatedBy: actorEmail,
  };
}

