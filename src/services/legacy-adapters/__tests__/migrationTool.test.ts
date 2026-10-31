import { test, describe } from 'node:test';
import assert from 'node:assert';
import { migrateLegacyFactoryData, LegacyMigrationSnapshot } from '../migrationTool';
import { WorkflowItem, OrderSlip } from '../../../types';

describe('Legacy Adapter & Multi-Tenant Migration Tool', () => {
  const sampleOrderSlips: OrderSlip[] = [
    {
      id: 'slip-231',
      jobNo: '231',
      partyName: 'Apex Textiles',
      firmName: 'TRISHARTH',
      chalanNo: 'CH-409',
      date: '2026-09-10',
      totalPcs: 150,
      fabricColumns: ['Kali', 'Lass', 'Dupatta'],
      colorRows: [
        {
          id: 'row-1',
          colorName: 'Royal Blue',
          designNumber: 'DSG-31',
          fabricQuantities: { Kali: 50, Lass: 50, Dupatta: 50 }
        }
      ]
    }
  ];

  const sampleWorkflowItems: WorkflowItem[] = [
    {
      id: 'wf-item-1',
      lotNumber: 'LOT-231-Lass-1',
      designNumber: 'DSG-31',
      designName: 'Apex Lass Blue',
      fabricType: 'Lass',
      fabricColor: 'Royal Blue',
      quantity: 50,
      unit: 'pieces',
      priority: 'high',
      createdDate: '2026-09-10',
      currentStage: 'embroidery',
      orderSlipId: 'slip-231',
      jobNo: '231',
      partyOrClientName: 'Apex Textiles'
    } as any,
    {
      id: 'wf-item-2-alt',
      lotNumber: 'LOT-231-Lass-2-ALT',
      designNumber: 'DSG-31',
      designName: 'Apex Lass Blue (Alter Lot)',
      fabricType: 'Lass',
      fabricColor: 'Royal Blue',
      quantity: 45,
      unit: 'pieces',
      priority: 'high',
      createdDate: '2026-09-10',
      currentStage: 'folding',
      splitFromLotNumber: 'LOT-231-Lass-2',
      jobNo: '231',
      partyOrClientName: 'Apex Textiles'
    } as any,
    {
      id: 'wf-item-orphan',
      lotNumber: 'LOT-ORPHAN-99',
      designNumber: 'DSG-99',
      designName: 'Standalone Sample',
      fabricType: 'Kali',
      fabricColor: 'White',
      quantity: 10,
      unit: 'pieces',
      priority: 'medium',
      createdDate: '2026-09-10',
      currentStage: 'fabric'
    } as any
  ];

  test('successfully executes dry-run migration with perfect piece parity', () => {
    const snapshot: LegacyMigrationSnapshot = {
      factoryCode: 'TRISHARTH-HQ',
      companyName: 'Trisharth Textiles',
      ownerEmail: 'trishilbalar@gmail.com',
      orderSlips: sampleOrderSlips,
      workflowItems: sampleWorkflowItems
    };

    const result = migrateLegacyFactoryData(snapshot, { dryRun: true });

    assert.strictEqual(result.report.dryRun, true);
    assert.strictEqual(result.report.totalLegacyItems, 3);
    assert.strictEqual(result.report.totalMigratedJobs, 3);
    assert.strictEqual(result.report.totalLegacyPieces, 105);
    assert.strictEqual(result.report.totalMigratedPieces, 105);
    assert.strictEqual(result.report.quantityParityExact, true);
    assert.strictEqual(result.report.discrepancies.length, 0);

    // Verify company & configuration
    assert.strictEqual(result.company.name, 'Trisharth Textiles');
    const activeWf = result.configuration.workflowVersions.find(w => w.versionId === result.configuration.activeWorkflowVersionId) || result.configuration.workflowVersions[0];
    assert.strictEqual(activeWf.stages.length, 10);
    assert.strictEqual(result.configuration.enabledModules.length, 5);
  });

  test('identifies orphaned lots and alteration split lots without losing records', () => {
    const snapshot: LegacyMigrationSnapshot = {
      factoryCode: 'TRISHARTH-HQ',
      companyName: 'Trisharth Textiles',
      ownerEmail: 'trishilbalar@gmail.com',
      orderSlips: [], // Empty order slips
      workflowItems: sampleWorkflowItems
    };

    const result = migrateLegacyFactoryData(snapshot, { dryRun: true });

    assert.strictEqual(result.report.totalMigratedJobs, 3);
    assert.strictEqual(result.report.totalMigratedPieces, 105);
    // All items without active parent slip are flagged as orphaned lots
    assert.strictEqual(result.report.orphanedLotsCount, 3);
    assert.ok(result.report.orphanedLots.includes('LOT-231-Lass-2-ALT'));
    assert.ok(result.report.orphanedLots.includes('LOT-ORPHAN-99'));
  });

  test('handles unknown stages by falling back to initial intake stage and logging discrepancies', () => {
    const badItem: WorkflowItem = {
      id: 'bad-stage-item',
      lotNumber: 'LOT-BAD-1',
      designNumber: 'DSG-ERR',
      fabricType: 'Kali',
      quantity: 20,
      unit: 'pieces',
      priority: 'low',
      createdDate: '2026-09-10',
      currentStage: 'unknown_alien_stage' as any
    } as any;

    const snapshot: LegacyMigrationSnapshot = {
      factoryCode: 'ATH-01',
      companyName: 'Atharva Textiles',
      ownerEmail: 'director@atharva.com',
      orderSlips: [],
      workflowItems: [badItem]
    };

    const result = migrateLegacyFactoryData(snapshot, { dryRun: true });

    assert.strictEqual(result.report.totalMigratedPieces, 20);
    assert.strictEqual(result.report.discrepancies.length, 1);
    assert.ok(result.report.discrepancies[0].includes('Unknown stage "unknown_alien_stage"'));
    assert.strictEqual(result.jobs[0].currentStageId, 'fabric'); // Fallback to initial
  });
});
