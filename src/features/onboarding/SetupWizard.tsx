import React, { useState, useEffect } from 'react';
import '../account/AccountShell.css';
import './SetupWizard.css';
import { 
  Building2, 
  Workflow, 
  Layers, 
  Truck, 
  Wallet, 
  Cpu, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  Sparkles, 
  Plus, 
  Trash2, 
  Sliders, 
  AlertCircle, 
  Save, 
  RotateCcw,
  Check,
  Package,
  Layers3,
  HelpCircle
} from 'lucide-react';
import { ALL_FACTORY_TEMPLATES, findTemplateById, instantiateTemplateConfiguration } from '../../templates/registry';
import { 
  FactoryConfiguration, 
  FactoryTemplate, 
  ModuleId, 
  PlanTier, 
  StageDefinitionConfig, 
  StageKind, 
  UnitDefinition, 
  FieldDefinition,
  TenantEntitlements 
} from '../../domain/configuration/types';
import { validateWorkflowVersion } from '../../domain/workflow/validator';
import { tenantRepository } from '../../services/repositories/tenantRepository';
import { UserMembership } from '../../domain/permissions/types';

interface SetupWizardProps {
  initialTemplateId?: string;
  onCancel: () => void;
  onActivated: (config: FactoryConfiguration, membership: UserMembership, entitlements: TenantEntitlements) => void;
  currentUserEmail?: string;
}

export const SetupWizard: React.FC<SetupWizardProps> = ({
  initialTemplateId = 'template_textile_v1',
  onCancel,
  onActivated,
  currentUserEmail = '',
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isActivating, setIsActivating] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [draftSavedToast, setDraftSavedToast] = useState<boolean>(false);

  // Step 1: Company & Factory Details
  const [companyName, setCompanyName] = useState<string>('');
  const [factoryName, setFactoryName] = useState<string>('');
  const [factoryCode, setFactoryCode] = useState<string>('');
  const [ownerEmail, setOwnerEmail] = useState<string>(currentUserEmail);
  const [timezone, setTimezone] = useState<string>('Asia/Kolkata');
  const [currency, setCurrency] = useState<string>('INR');

  // Step 2: Modules & Capacity
  const [enabledModules, setEnabledModules] = useState<ModuleId[]>(['workflow', 'inventory', 'dispatch']);
  const [planTier, setPlanTier] = useState<PlanTier>('growth');

  // Step 3: Template Selection
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(initialTemplateId);

  // Step 4: Workflow Stages
  const [workflowStages, setWorkflowStages] = useState<StageDefinitionConfig[]>([]);
  const [initialStageId, setInitialStageId] = useState<string>('');
  const [completionStageId, setCompletionStageId] = useState<string>('');

  // Step 5: Inventory Settings
  const [units, setUnits] = useState<UnitDefinition[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);

  // Step 6: Custom Fields
  const [customFields, setCustomFields] = useState<FieldDefinition[]>([]);

  // Load template defaults when selectedTemplateId changes
  useEffect(() => {
    const tmpl = findTemplateById(selectedTemplateId);
    setWorkflowStages(JSON.parse(JSON.stringify(tmpl.workflow.stages)));
    setInitialStageId(tmpl.workflow.initialStageId);
    setCompletionStageId(tmpl.workflow.completionStageId);
    setUnits(JSON.parse(JSON.stringify(tmpl.units)));
    setCategories([...tmpl.categories]);
    setLocations([...tmpl.locations]);
    setCustomFields(JSON.parse(JSON.stringify(tmpl.customFields)));
  }, [selectedTemplateId]);

  // Draft persistence in localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('factory_setup_draft_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.companyName) setCompanyName(parsed.companyName);
        if (parsed.factoryName) setFactoryName(parsed.factoryName);
        if (parsed.factoryCode) setFactoryCode(parsed.factoryCode);
        if (parsed.ownerEmail) setOwnerEmail(parsed.ownerEmail);
        if (parsed.enabledModules) setEnabledModules(parsed.enabledModules);
        if (parsed.planTier) setPlanTier(parsed.planTier);
        if (parsed.currentStep) setCurrentStep(parsed.currentStep);
      }
    } catch {}
  }, []);

  const saveDraftToStorage = (stepNum: number) => {
    try {
      const draft = {
        companyName,
        factoryName,
        factoryCode,
        ownerEmail,
        enabledModules,
        planTier,
        currentStep: stepNum,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem('factory_setup_draft_v2', JSON.stringify(draft));
      setDraftSavedToast(true);
      setTimeout(() => setDraftSavedToast(false), 2500);
    } catch {}
  };

  const handleNextStep = () => {
    setErrorMessage(null);
    if (currentStep === 1) {
      if (!companyName.trim()) {
        setErrorMessage('Please enter your Company Name.');
        return;
      }
      if (!factoryName.trim()) {
        setErrorMessage('Please enter your Factory / Site Name.');
        return;
      }
      if (!factoryCode.trim()) {
        setErrorMessage('Please enter a 3-8 character Factory Code (e.g. OAK-01, ATH-01).');
        return;
      }
      if (!ownerEmail.trim()) {
        setErrorMessage('Please enter the Owner Email address.');
        return;
      }
    }

    if (currentStep === 2) {
      if (enabledModules.length === 0) {
        setErrorMessage('Please select at least one module.');
        return;
      }
    }

    // Skip workflow step if workflow module is disabled
    let nextStep = currentStep + 1;
    if (nextStep === 4 && !enabledModules.includes('workflow')) {
      nextStep = 5;
    }
    // Skip inventory step if inventory module is disabled
    if (nextStep === 5 && !enabledModules.includes('inventory')) {
      nextStep = 6;
    }

    setCurrentStep(nextStep);
    saveDraftToStorage(nextStep);
  };

  const handlePrevStep = () => {
    setErrorMessage(null);
    let prevStep = currentStep - 1;
    if (prevStep === 5 && !enabledModules.includes('inventory')) {
      prevStep = 4;
    }
    if (prevStep === 4 && !enabledModules.includes('workflow')) {
      prevStep = 3;
    }
    setCurrentStep(Math.max(1, prevStep));
  };

  // Toggle Module
  const toggleModule = (mod: ModuleId) => {
    if (enabledModules.includes(mod)) {
      setEnabledModules(enabledModules.filter((m) => m !== mod));
    } else {
      setEnabledModules([...enabledModules, mod]);
    }
  };

  // Idempotent Workspace Activation
  const handleActivateWorkspace = async () => {
    if (isActivating) return; // Prevent double-clicks
    setIsActivating(true);
    setErrorMessage(null);

    try {
      const cleanCompanyId = `comp_${companyName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now()}`;
      const cleanFactoryId = `fact_${factoryCode.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

      // Build Workflow Version
      const tmpl = findTemplateById(selectedTemplateId);
      const workflowVersionId = `wf_${cleanFactoryId}_v1`;
      const workflow = {
        workflowId: `wf_${cleanFactoryId}`,
        versionId: workflowVersionId,
        versionNumber: 1,
        name: `${factoryName} Production Workflow`,
        stages: workflowStages,
        initialStageId: initialStageId || workflowStages[0]?.id || 'stage_1',
        completionStageId: completionStageId || workflowStages[workflowStages.length - 1]?.id || 'stage_last',
        isPublished: true,
        publishedAt: new Date().toISOString(),
        publishedBy: ownerEmail,
      };

      // Validate workflow if enabled
      if (enabledModules.includes('workflow')) {
        const valRes = validateWorkflowVersion(workflow);
        if (!valRes.isValid) {
          setErrorMessage(`Workflow validation failed: ${valRes.errors.join('; ')}`);
          setIsActivating(false);
          return;
        }
      }

      const factoryConfig: FactoryConfiguration = {
        schemaVersion: '1.0.0',
        companyId: cleanCompanyId,
        factoryId: cleanFactoryId,
        factoryName,
        factoryCode: factoryCode.toUpperCase().trim(),
        timezone,
        currency,
        enabledModules,
        activeWorkflowVersionId: workflowVersionId,
        workflowVersions: [workflow],
        units,
        categories,
        locations,
        customFields,
        status: 'published',
        updatedAt: new Date().toISOString(),
        updatedBy: ownerEmail,
      };

      const entitlements: TenantEntitlements = {
        companyId: cleanCompanyId,
        planTier,
        planStatus: 'trial',
        allowedModules: enabledModules,
        maxUsers: planTier === 'starter' ? 5 : planTier === 'growth' ? 25 : 500,
        maxFactories: planTier === 'starter' ? 1 : planTier === 'growth' ? 3 : 100,
        maxActiveJobs: planTier === 'starter' ? 100 : planTier === 'growth' ? 500 : 10000,
        storageQuotaMb: planTier === 'starter' ? 1024 : 5120,
        trialExpiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
        updatedBy: 'onboarding_activation',
      };

      const membership: UserMembership = {
        userId: `usr_${Date.now()}`,
        email: ownerEmail,
        name: ownerEmail.split('@')[0],
        companyId: cleanCompanyId,
        role: 'company_owner',
        permittedFactoryIds: ['*'],
        financialAccess: true,
        status: 'active',
      };

      // 1. Save company metadata
      await tenantRepository.saveCompany({
        id: cleanCompanyId,
        name: companyName,
        code: factoryCode.toUpperCase().trim(),
        ownerEmail,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // 2. Save entitlements
      await tenantRepository.saveEntitlements(entitlements);

      // 3. Save owner membership
      await tenantRepository.saveMembership(membership);

      // 4. Save factory configuration
      await tenantRepository.saveFactoryConfiguration(factoryConfig);

      // 5. Clear draft
      localStorage.removeItem('factory_setup_draft_v2');

      // 6. Notify parent & transition to workspace
      onActivated(factoryConfig, membership, entitlements);
    } catch (err: any) {
      setErrorMessage(`Activation error: ${err?.message || 'Could not save configuration.'}`);
      setIsActivating(false);
    }
  };

  return (
    <div className="tf-setup min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* Top Wizard Bar */}
      <div className="bg-slate-950 border-b border-slate-800 px-4 sm:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white text-sm">
            F
          </div>
          <div>
            <h1 className="text-sm font-bold text-white flex items-center space-x-2">
              <span>Set up your workspace</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-indigo-400 border border-slate-700">
                Step {currentStep} of 8
              </span>
            </h1>
            <p className="text-[11px] text-slate-400">A process built around your factory</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {draftSavedToast && (
            <span className="text-xs text-emerald-400 font-mono flex items-center space-x-1 animate-in fade-in">
              <Check className="w-3.5 h-3.5" />
              <span>Draft auto-saved</span>
            </span>
          )}

          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Cancel &amp; Exit
          </button>
        </div>
      </div>

      {/* Main Step Content */}
      <div className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 flex flex-col justify-between">
        <div>
          {errorMessage && (
            <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start space-x-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* STEP 1: Company & Factory Details */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white">Company &amp; Factory Identity</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Enter your company organization and your primary operating facility code.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Company / Organization Name</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Atharva Woodcraft Ltd"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Primary Factory / Plant Name</label>
                  <input
                    type="text"
                    value={factoryName}
                    onChange={(e) => setFactoryName(e.target.value)}
                    placeholder="e.g. Surat Main Plant"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Factory Code (3-8 letters)</label>
                  <input
                    type="text"
                    value={factoryCode}
                    onChange={(e) => setFactoryCode(e.target.value.toUpperCase())}
                    placeholder="e.g. ATH-01"
                    maxLength={10}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-mono uppercase focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Owner Email Address</label>
                  <input
                    type="email"
                    value={ownerEmail}
                    onChange={(e) => setOwnerEmail(e.target.value)}
                    placeholder="e.g. director@company.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Module Selection & Capacity */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white">Select Supported Modules</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Choose the operations your factory floor actually uses. Unselected modules will remain cleanly hidden.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {[
                  {
                    id: 'workflow' as ModuleId,
                    label: 'Workflow Kanban & Rework',
                    desc: 'Ordered stages, unit/batch tracking, inspection & alteration routing.',
                    icon: Workflow,
                  },
                  {
                    id: 'inventory' as ModuleId,
                    label: 'Inventory & Materials',
                    desc: 'Raw materials, categories, bins, restock alerts and stock consumption.',
                    icon: Layers,
                  },
                  {
                    id: 'dispatch' as ModuleId,
                    label: 'Dispatch & Shipments',
                    desc: 'Delivery challans, logistics status, and customer shipping records.',
                    icon: Truck,
                  },
                  {
                    id: 'finance' as ModuleId,
                    label: 'Staff Wages & Payables (Legacy)',
                    desc: 'Monthly employee payroll, operating expenses, and supplier invoices.',
                    icon: Wallet,
                  },
                  {
                    id: 'machines' as ModuleId,
                    label: 'Machine Telemetry (Legacy)',
                    desc: 'Multi-head machine RPM, speed modes, and maintenance tracking.',
                    icon: Cpu,
                  },
                ].map((m) => {
                  const isChecked = enabledModules.includes(m.id);
                  const Icon = m.icon;
                  return (
                    <div
                      key={m.id}
                      onClick={() => toggleModule(m.id)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start space-x-3.5 ${
                        isChecked
                          ? 'bg-indigo-950/40 border-indigo-500/70 shadow-md shadow-indigo-500/10'
                          : 'bg-slate-800/40 border-slate-700/60 hover:border-slate-600'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center mt-0.5 transition-colors ${
                          isChecked ? 'bg-indigo-600 text-white' : 'border border-slate-600 bg-slate-800'
                        }`}
                      >
                        {isChecked && <Check className="w-3.5 h-3.5" />}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <Icon className={`w-4 h-4 ${isChecked ? 'text-indigo-400' : 'text-slate-400'}`} />
                          <h4 className="text-xs font-bold text-white">{m.label}</h4>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{m.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Plan Capacity Selection */}
              <div className="pt-4 border-t border-slate-800 space-y-3">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Choose Capacity Tier (Trial)</h3>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'starter' as PlanTier, label: 'Starter', cap: '1 Factory · 5 Seats · 100 Jobs' },
                    { id: 'growth' as PlanTier, label: 'Growth', cap: '3 Factories · 25 Seats · 500 Jobs' },
                    { id: 'enterprise' as PlanTier, label: 'Enterprise', cap: 'Unlimited Sites · 500+ Seats' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPlanTier(p.id)}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                        planTier === p.id
                          ? 'bg-indigo-600/20 border-indigo-500 text-white'
                          : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="text-xs font-bold capitalize">{p.label}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{p.cap}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Template Selection */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white">Choose a Starter Template</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Installs pre-configured stages and units for your industry. You can customize them in the next steps.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {ALL_FACTORY_TEMPLATES.map((tmpl) => (
                  <div
                    key={tmpl.id}
                    onClick={() => setSelectedTemplateId(tmpl.id)}
                    className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-4 ${
                      selectedTemplateId === tmpl.id
                        ? 'bg-indigo-950/40 border-indigo-500 shadow-xl shadow-indigo-500/10'
                        : 'bg-slate-800/40 border-slate-700/60 hover:border-slate-600'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                        <span>{tmpl.industry}</span>
                        {selectedTemplateId === tmpl.id && (
                          <span className="w-2 h-2 rounded-full bg-indigo-400 ring-4 ring-indigo-400/20" />
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-white mt-1">{tmpl.name}</h4>
                      <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{tmpl.description}</p>
                    </div>

                    <div className="pt-2 border-t border-slate-800 text-[11px] font-mono text-indigo-300">
                      {tmpl.workflow.stages.length} Stages · {tmpl.units.length} Units
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 4: Workflow Stages Editor */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">Configure Workflow Stages</h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Edit labels, stage kinds, inspection check-points, and rework destinations.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const newId = `stage_${Date.now()}`;
                    const newStage: StageDefinitionConfig = {
                      id: newId,
                      label: `New Stage ${workflowStages.length + 1}`,
                      shortName: `Stage ${workflowStages.length + 1}`,
                      stageKind: 'operation',
                      order: workflowStages.length + 1,
                      color: { bg: 'bg-slate-50', border: 'border-slate-300', text: 'text-slate-900', badge: 'bg-slate-200 text-slate-800', headerBg: 'bg-slate-100' },
                      iconName: 'Box',
                      allowedTransitionStageIds: [],
                    };
                    setWorkflowStages([...workflowStages, newStage]);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center space-x-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Stage</span>
                </button>
              </div>

              <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                {workflowStages.map((stg, idx) => (
                  <div
                    key={stg.id}
                    className="p-3.5 rounded-xl bg-slate-800/70 border border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center space-x-2.5 flex-1 w-full">
                      <span className="w-5 text-center font-mono font-bold text-slate-500 text-[11px]">{idx + 1}</span>
                      <input
                        type="text"
                        value={stg.label}
                        onChange={(e) => {
                          const updated = [...workflowStages];
                          updated[idx].label = e.target.value;
                          setWorkflowStages(updated);
                        }}
                        className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
                      />
                    </div>

                    <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                      <select
                        value={stg.stageKind}
                        onChange={(e) => {
                          const updated = [...workflowStages];
                          updated[idx].stageKind = e.target.value as StageKind;
                          if (e.target.value === 'completion') {
                            updated[idx].isTerminalCompletion = true;
                            setCompletionStageId(stg.id);
                          }
                          setWorkflowStages(updated);
                        }}
                        className="px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-[11px]"
                      >
                        <option value="intake">Intake</option>
                        <option value="operation">Operation</option>
                        <option value="inspection">Inspection</option>
                        <option value="rework">Rework</option>
                        <option value="completion">Completion</option>
                      </select>

                      {workflowStages.length > 2 && (
                        <button
                          type="button"
                          onClick={() => {
                            setWorkflowStages(workflowStages.filter((_, i) => i !== idx));
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-700/60"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 5: Inventory Units, Categories & Locations */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white">Measurement Units &amp; Warehouse Categories</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Define units with exact decimal precision to prevent quantity calculation drift.
                </p>
              </div>

              {/* Units Editor */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Units of Measure</h3>
                  <button
                    type="button"
                    onClick={() => {
                      const newUnit: UnitDefinition = {
                        id: `unit_${Date.now()}`,
                        label: 'New Unit',
                        symbol: 'u',
                        dimension: 'count',
                        precision: 0,
                      };
                      setUnits([...units, newUnit]);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-200 text-[11px] font-bold hover:bg-slate-700 flex items-center space-x-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Unit</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {units.map((u, idx) => (
                    <div key={u.id} className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between gap-2 text-xs">
                      <input
                        type="text"
                        value={u.label}
                        onChange={(e) => {
                          const updated = [...units];
                          updated[idx].label = e.target.value;
                          setUnits(updated);
                        }}
                        className="px-2 py-1 rounded bg-slate-900 border border-slate-700 text-white text-xs w-28"
                      />
                      <input
                        type="text"
                        value={u.symbol}
                        onChange={(e) => {
                          const updated = [...units];
                          updated[idx].symbol = e.target.value;
                          setUnits(updated);
                        }}
                        className="px-2 py-1 rounded bg-slate-900 border border-slate-700 text-white text-xs w-14 font-mono text-center"
                      />
                      <span className="text-[10px] text-slate-400 font-mono">Precision: {u.precision}</span>
                      {units.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setUnits(units.filter((_, i) => i !== idx))}
                          className="p-1 text-slate-400 hover:text-rose-400"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Categories & Locations */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-800">
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Inventory Categories</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {categories.map((cat, idx) => (
                      <span key={idx} className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-xs">
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Storage Locations</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {locations.map((loc, idx) => (
                      <span key={idx} className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-xs">
                        {loc}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: Custom Fields */}
          {currentStep === 6 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">Custom Fields for Jobs</h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Add custom job attributes (e.g. Fabric Style, Wood Species, Customer PO).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const newField: FieldDefinition = {
                      id: `field_${Date.now()}`,
                      label: 'New Field',
                      entityType: 'job',
                      inputType: 'text',
                      required: false,
                    };
                    setCustomFields([...customFields, newField]);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center space-x-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Field</span>
                </button>
              </div>

              <div className="space-y-2.5">
                {customFields.map((f, idx) => (
                  <div key={f.id} className="p-3.5 rounded-xl bg-slate-800/70 border border-slate-700 flex items-center justify-between gap-3 text-xs">
                    <input
                      type="text"
                      value={f.label}
                      onChange={(e) => {
                        const updated = [...customFields];
                        updated[idx].label = e.target.value;
                        setCustomFields(updated);
                      }}
                      className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
                    />

                    <select
                      value={f.inputType}
                      onChange={(e) => {
                        const updated = [...customFields];
                        updated[idx].inputType = e.target.value as any;
                        setCustomFields(updated);
                      }}
                      className="px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-[11px]"
                    >
                      <option value="text">Text</option>
                      <option value="number">Number</option>
                      <option value="date">Date</option>
                      <option value="dropdown">Dropdown</option>
                      <option value="checkbox">Checkbox</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => setCustomFields(customFields.filter((_, i) => i !== idx))}
                      className="p-1.5 text-slate-400 hover:text-rose-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 7: Team Roles Preview */}
          {currentStep === 7 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white">Team Roles &amp; Access</h2>
                <p className="text-xs text-slate-400 mt-1">
                  You will be initialized as the <strong>Company Owner</strong>. You can invite team members later with granular permissions.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700 space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400">
                    Company Owner
                  </span>
                  <h4 className="text-xs font-bold text-white mt-1">Full Organization Access</h4>
                  <p className="text-[11px] text-slate-400">
                    Manages subscriptions, invites members, publishes workflow versions, and oversees all operating plants.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700 space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-sky-500/20 text-sky-400">
                    Factory Admin
                  </span>
                  <h4 className="text-xs font-bold text-white mt-1">Plant Manager</h4>
                  <p className="text-[11px] text-slate-400">
                    Configures local stages, edits draft settings, assigns machines, and monitors daily inventory levels.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700 space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                    Floor Operator
                  </span>
                  <h4 className="text-xs font-bold text-white mt-1">Line Worker / QC</h4>
                  <p className="text-[11px] text-slate-400">
                    Moves batches between stages, reports rework/defects, scans unit barcodes, and records actual consumption.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700 space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-500/20 text-slate-300">
                    Auditor / Viewer
                  </span>
                  <h4 className="text-xs font-bold text-white mt-1">Read-Only</h4>
                  <p className="text-[11px] text-slate-400">
                    Inspects live metrics, reports, and job statuses without the ability to modify production records.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 8: Isolated Sample Preview & Activation */}
          {currentStep === 8 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white">Review &amp; Idempotent Activation</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Preview your sample factory pipeline before publishing. No real inventory or billing is charged.
                </p>
              </div>

              {/* Summary Card */}
              <div className="p-5 rounded-2xl bg-slate-800/70 border border-slate-700 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-slate-400">Company:</span>
                  <p className="font-bold text-white mt-0.5">{companyName}</p>
                </div>
                <div>
                  <span className="text-slate-400">Factory Site:</span>
                  <p className="font-bold text-white mt-0.5">{factoryName} ({factoryCode})</p>
                </div>
                <div>
                  <span className="text-slate-400">Modules:</span>
                  <p className="font-bold text-indigo-300 mt-0.5">{enabledModules.join(', ')}</p>
                </div>
                <div>
                  <span className="text-slate-400">Capacity Tier:</span>
                  <p className="font-bold text-emerald-400 mt-0.5 capitalize">{planTier} (Trial)</p>
                </div>
              </div>

              {/* Interactive Synthetic Kanban Preview */}
              {enabledModules.includes('workflow') && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Live Pipeline Preview ({workflowStages.length} Stages)
                  </h3>
                  <div className="flex gap-3 overflow-x-auto pb-3 pt-1">
                    {workflowStages.map((stg, i) => (
                      <div
                        key={stg.id}
                        className="w-48 shrink-0 p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 shadow-md"
                      >
                        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                          <span>#{i + 1}</span>
                          <span className="text-indigo-400 uppercase font-bold">{stg.stageKind}</span>
                        </div>
                        <h4 className="text-xs font-black text-white">{stg.label}</h4>

                        {/* Sample Synthetic Card */}
                        {i === 0 && (
                          <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-[11px] space-y-1">
                            <span className="text-indigo-300 font-bold font-mono">SAMPLE-LOT-01</span>
                            <p className="text-slate-300">Sample Order (50 {units[0]?.symbol || 'pcs'})</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs flex items-center space-x-2.5">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-indigo-400" />
                <span>
                  Ready to launch! Clicking activate will provision your company, set up your factory database documents, and load your custom workspace.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Navigation Buttons */}
        <div className="pt-8 border-t border-slate-800 flex items-center justify-between">
          <button
            type="button"
            disabled={currentStep === 1 || isActivating}
            onClick={handlePrevStep}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer ${
              currentStep === 1
                ? 'opacity-30 cursor-not-allowed text-slate-600'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>

          <div className="flex items-center space-x-3">
            {currentStep < 8 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center space-x-1.5 transition-all transform active:scale-95 cursor-pointer"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                disabled={isActivating}
                onClick={handleActivateWorkspace}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-xs font-bold shadow-xl shadow-emerald-500/20 flex items-center space-x-2 transition-all transform active:scale-95 cursor-pointer disabled:opacity-50"
              >
                {isActivating ? (
                  <span>Provisioning Workspace...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Activate Factory Workspace</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

