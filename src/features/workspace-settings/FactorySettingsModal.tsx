import React, { useState, useEffect } from 'react';
import { 
  X, 
  Settings, 
  Workflow, 
  Layers, 
  Sliders, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Archive, 
  Sparkles, 
  Lock, 
  Save, 
  History,
  Users,
  UserPlus,
  Shield,
  Smartphone,
  Globe,
  Check,
  Edit2
} from 'lucide-react';
import { FactoryConfiguration, WorkflowVersion, StageDefinitionConfig, StageKind, FieldDefinition, UnitDefinition, ModuleId } from '../../domain/configuration/types';
import { validateWorkflowVersion } from '../../domain/workflow/validator';
import { UserMembership, UserRole, canPerformAction } from '../../domain/permissions/types';
import { tenantRepository } from '../../services/repositories/tenantRepository';
import { fetchCloudFinanceEmployees, saveCloudFinance } from '../../services/cloudDbService';
import { EmployeeRecord } from '../../types';

interface FactorySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: FactoryConfiguration;
  membership: UserMembership | null;
  onConfigUpdated: (newConfig: FactoryConfiguration) => void;
}

export const FactorySettingsModal: React.FC<FactorySettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  membership,
  onConfigUpdated,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'workflow' | 'units' | 'fields' | 'team' | 'versions'>('workflow');
  const [draftStages, setDraftStages] = useState<StageDefinitionConfig[]>(() => {
    const activeWf = config.workflowVersions.find((v) => v.versionId === config.activeWorkflowVersionId) || config.workflowVersions[0];
    return activeWf ? JSON.parse(JSON.stringify(activeWf.stages)) : [];
  });
  const [draftUnits, setDraftUnits] = useState<UnitDefinition[]>(() => JSON.parse(JSON.stringify(config.units)));
  const [draftFields, setDraftFields] = useState<FieldDefinition[]>(() => JSON.parse(JSON.stringify(config.customFields)));
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Team & Permissions State (Company Owner Access Control)
  const [teamMembers, setTeamMembers] = useState<UserMembership[]>([]);
  const [employeesList, setEmployeesList] = useState<EmployeeRecord[]>([]);
  const [loadingTeam, setLoadingTeam] = useState<boolean>(false);
  const [isEditingMember, setIsEditingMember] = useState<boolean>(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  const [formMemberName, setFormMemberName] = useState('');
  const [formMemberEmail, setFormMemberEmail] = useState('');
  const [formMemberCode, setFormMemberCode] = useState('');
  const [formMemberPassword, setFormMemberPassword] = useState('pass@123');
  const [formMemberRole, setFormMemberRole] = useState<UserRole>('operator');
  const [formMemberWebAccess, setFormMemberWebAccess] = useState(true);
  const [formMemberMobileAccess, setFormMemberMobileAccess] = useState(true);
  const [formMemberFinancialAccess, setFormMemberFinancialAccess] = useState(false);
  const [formMemberModules, setFormMemberModules] = useState<ModuleId[]>(['workflow', 'inventory']);
  const [formMemberStatus, setFormMemberStatus] = useState<'active' | 'disabled'>('active');
  const [isSavingMember, setIsSavingMember] = useState(false);

  const isCompanyOwnerOrSuperAdmin = membership?.role === 'company_owner' || membership?.role === 'super_admin';
  const canManageTeam = isCompanyOwnerOrSuperAdmin || membership?.role === 'factory_admin';

  const loadTeamData = async () => {
    setLoadingTeam(true);
    try {
      const [memberships, emps] = await Promise.all([
        tenantRepository.listMemberships(config.companyId),
        fetchCloudFinanceEmployees(config.factoryCode).catch(() => [] as EmployeeRecord[])
      ]);
      setTeamMembers(memberships);
      setEmployeesList(emps);
    } catch (err) {
      console.warn('Failed to load team data:', err);
    } finally {
      setLoadingTeam(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'team') {
      loadTeamData();
    }
  }, [activeTab]);

  const handleOpenAddMember = () => {
    setEditingUserId(null);
    setFormMemberName('');
    setFormMemberEmail('');
    setFormMemberCode(`EMP-${Math.floor(100 + Math.random() * 900)}`);
    setFormMemberPassword('pass@123');
    setFormMemberRole('operator');
    setFormMemberWebAccess(true);
    setFormMemberMobileAccess(true);
    setFormMemberFinancialAccess(false);
    setFormMemberModules(['workflow', 'inventory']);
    setFormMemberStatus('active');
    setIsEditingMember(true);
  };

  const handleEditMember = (m: UserMembership) => {
    setEditingUserId(m.userId);
    setFormMemberName(m.name);
    setFormMemberEmail(m.email);
    setFormMemberCode(m.employeeCode || m.userId);
    setFormMemberRole(m.role);
    setFormMemberWebAccess(m.webAccess !== false);
    setFormMemberMobileAccess(m.mobileAccess !== false);
    setFormMemberFinancialAccess(Boolean(m.financialAccess));
    setFormMemberModules(m.permittedModules || ['workflow', 'inventory']);
    setFormMemberStatus(m.status === 'disabled' ? 'disabled' : 'active');

    const matchedEmp = employeesList.find(e => 
      (m.employeeCode && e.employeeId === m.employeeCode) || 
      (m.email && e.googleEmail?.toLowerCase() === m.email.toLowerCase())
    );
    setFormMemberPassword(matchedEmp?.loginPassword || 'pass@123');
    setIsEditingMember(true);
  };

  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formMemberName.trim()) {
      alert('Please enter member name');
      return;
    }
    setIsSavingMember(true);
    try {
      const cleanEmail = formMemberEmail.trim().toLowerCase();
      const cleanCode = formMemberCode.trim().toUpperCase() || `EMP-${Date.now().toString().slice(-4)}`;
      const targetUserId = editingUserId || (cleanEmail ? cleanEmail.replace(/[^a-zA-Z0-9_-]/g, '_') : `user_${Date.now()}`);

      const newMembership: UserMembership = {
        userId: targetUserId,
        email: cleanEmail,
        name: formMemberName.trim(),
        companyId: config.companyId,
        role: formMemberRole,
        permittedFactoryIds: [config.factoryId],
        webAccess: formMemberWebAccess,
        mobileAccess: formMemberMobileAccess,
        financialAccess: formMemberFinancialAccess,
        permittedModules: formMemberModules,
        employeeCode: cleanCode,
        status: formMemberStatus
      };

      await tenantRepository.saveMembership(newMembership);

      // Sync to cloud finance employee roster so credentials / mobile sync work
      const existingEmpIdx = employeesList.findIndex(e => 
        (e.employeeId && e.employeeId.toUpperCase() === cleanCode) ||
        (cleanEmail && e.googleEmail && e.googleEmail.toLowerCase() === cleanEmail)
      );

      let updatedEmps: EmployeeRecord[];
      if (existingEmpIdx >= 0) {
        updatedEmps = employeesList.map((emp, idx) => {
          if (idx !== existingEmpIdx) return emp;
          return {
            ...emp,
            name: formMemberName.trim(),
            employeeId: cleanCode,
            googleEmail: cleanEmail,
            loginPassword: formMemberPassword || emp.loginPassword || 'pass@123',
            webAccess: formMemberWebAccess,
            mobileAccess: formMemberMobileAccess,
            financialAccess: formMemberFinancialAccess,
            role: formMemberRole === 'factory_admin' ? 'Factory Admin' : (formMemberRole === 'operator' ? 'Floor Operator' : 'Viewer'),
            noAppAccess: !formMemberWebAccess && !formMemberMobileAccess
          };
        });
      } else {
        const newEmp: EmployeeRecord = {
          id: `emp-${Date.now()}`,
          employeeId: cleanCode,
          name: formMemberName.trim(),
          role: formMemberRole === 'factory_admin' ? 'Factory Admin' : (formMemberRole === 'operator' ? 'Floor Operator' : 'Viewer'),
          department: 'Production',
          googleEmail: cleanEmail,
          loginPassword: formMemberPassword || 'pass@123',
          salaryType: 'monthly',
          baseSalary: 0,
          netPayable: 0,
          paymentStatus: 'paid',
          paymentMethod: 'bank_transfer',
          webAccess: formMemberWebAccess,
          mobileAccess: formMemberMobileAccess,
          financialAccess: formMemberFinancialAccess,
          noAppAccess: !formMemberWebAccess && !formMemberMobileAccess
        };
        updatedEmps = [...employeesList, newEmp];
      }

      await saveCloudFinance({ employees: updatedEmps }, config.factoryCode);
      setEmployeesList(updatedEmps);

      await loadTeamData();
      setIsEditingMember(false);
      setEditingUserId(null);
      setStatusMessage({
        type: 'success',
        text: `Permissions saved for "${formMemberName.trim()}". Role: ${formMemberRole}. Access settings are active immediately.`
      });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: `Failed to save member: ${err?.message || err}` });
    } finally {
      setIsSavingMember(false);
    }
  };

  const handleDeleteMember = async (userId: string, empCode?: string, empEmail?: string) => {
    if (!window.confirm('Are you sure you want to remove this team member and revoke their access?')) {
      return;
    }
    try {
      await tenantRepository.deleteMembership(config.companyId, userId);
      if (empCode || empEmail) {
        const updatedEmps = employeesList.filter(e => {
          const matchCode = empCode && e.employeeId.toUpperCase() === empCode.toUpperCase();
          const matchEmail = empEmail && e.googleEmail && e.googleEmail.toLowerCase() === empEmail.toLowerCase();
          return !matchCode && !matchEmail;
        });
        await saveCloudFinance({ employees: updatedEmps }, config.factoryCode);
        setEmployeesList(updatedEmps);
      }
      await loadTeamData();
      setStatusMessage({ type: 'success', text: 'Team member removed and access revoked.' });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: `Failed to delete member: ${err?.message || err}` });
    }
  };

  const canPublish = canPerformAction(membership, null, 'publish_configuration', config.factoryId).allowed;
  const canEditDraft = canPerformAction(membership, null, 'edit_configuration_draft', config.factoryId).allowed;

  const handlePublishNewVersion = async () => {
    if (!canPublish) {
      setStatusMessage({ type: 'error', text: 'You do not have permission to publish workflow versions.' });
      return;
    }

    setIsPublishing(true);
    setStatusMessage(null);

    const activeWf = config.workflowVersions.find((v) => v.versionId === config.activeWorkflowVersionId) || config.workflowVersions[0];
    const newVersionNumber = (activeWf?.versionNumber || 1) + 1;
    const newVersionId = `wf_${config.factoryId}_v${newVersionNumber}_${Date.now()}`;

    const newWorkflowVersion: WorkflowVersion = {
      workflowId: activeWf?.workflowId || `wf_${config.factoryId}`,
      versionId: newVersionId,
      versionNumber: newVersionNumber,
      name: `${config.factoryName} Workflow (v${newVersionNumber})`,
      stages: draftStages,
      initialStageId: draftStages[0]?.id || 'stage_1',
      completionStageId: draftStages[draftStages.length - 1]?.id || 'stage_last',
      isPublished: true,
      publishedAt: new Date().toISOString(),
      publishedBy: membership?.email || 'admin',
    };

    const valResult = validateWorkflowVersion(newWorkflowVersion);
    if (!valResult.isValid) {
      setStatusMessage({ type: 'error', text: `Validation failed: ${valResult.errors.join('; ')}` });
      setIsPublishing(false);
      return;
    }

    try {
      const updatedConfig: FactoryConfiguration = {
        ...config,
        activeWorkflowVersionId: newVersionId,
        workflowVersions: [newWorkflowVersion, ...config.workflowVersions],
        units: draftUnits,
        customFields: draftFields,
        updatedAt: new Date().toISOString(),
        updatedBy: membership?.email || 'admin',
      };

      await tenantRepository.saveFactoryConfiguration(updatedConfig);
      onConfigUpdated(updatedConfig);
      setStatusMessage({
        type: 'success',
        text: `Version ${newVersionNumber} published successfully! New jobs will use this version. Active jobs retain their original version.`,
      });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: `Failed to save configuration: ${err?.message || err}` });
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="tf-dialog-layer fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-indigo-600/20 text-indigo-400">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                <span>Factory Settings &amp; Configuration</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                  {config.factoryCode}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Manage workflow versions, custom fields, and units. Published versions are immutable.
              </p>
            </div>
          </div>

          <button
            type="button"
            aria-label="Close dialog" data-dialog-close onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 border-b border-slate-800 flex space-x-4 bg-slate-950/40">
          {[
            { id: 'workflow' as const, label: 'Stages & Workflow', icon: Workflow },
            { id: 'units' as const, label: 'Units of Measure', icon: Layers },
            { id: 'fields' as const, label: 'Custom Job Fields', icon: Sliders },
            { id: 'team' as const, label: 'Team & Permissions', icon: Users },
            { id: 'versions' as const, label: 'Version History', icon: History },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 text-xs font-bold border-b-2 flex items-center space-x-1.5 transition-colors cursor-pointer ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-white'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {statusMessage && (
            <div
              className={`p-4 rounded-xl text-xs flex items-start space-x-2.5 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {!canEditDraft && (
            <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700 text-slate-400 text-xs flex items-center space-x-2">
              <Lock className="w-4 h-4 text-amber-400 shrink-0" />
              <span>You have read-only access to factory settings. Only Company Owners &amp; Factory Admins can modify settings.</span>
            </div>
          )}

          {/* TAB 1: WORKFLOW STAGES */}
          {activeTab === 'workflow' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Draft Workflow Stages</h3>
                  <p className="text-xs text-slate-400">
                    Modifying stages here creates a new draft. Publishing seals an immutable version.
                  </p>
                </div>
                {canEditDraft && (
                  <button
                    type="button"
                    onClick={() => {
                      const newStage: StageDefinitionConfig = {
                        id: `stg_${Date.now()}`,
                        label: `New Stage ${draftStages.length + 1}`,
                        shortName: `S${draftStages.length + 1}`,
                        stageKind: 'operation',
                        order: draftStages.length + 1,
                        color: { bg: 'bg-slate-50', border: 'border-slate-300', text: 'text-slate-900', badge: 'bg-slate-200 text-slate-800', headerBg: 'bg-slate-100' },
                        iconName: 'Box',
                        allowedTransitionStageIds: [],
                      };
                      setDraftStages([...draftStages, newStage]);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center space-x-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Stage</span>
                  </button>
                )}
              </div>

              <div className="space-y-2.5">
                {draftStages.map((stg, idx) => (
                  <div
                    key={stg.id}
                    className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center space-x-2.5 flex-1 w-full">
                      <span className="w-6 text-center font-mono font-bold text-slate-500">{idx + 1}</span>
                      <input
                        type="text"
                        disabled={!canEditDraft}
                        value={stg.label}
                        onChange={(e) => {
                          const updated = [...draftStages];
                          updated[idx].label = e.target.value;
                          setDraftStages(updated);
                        }}
                        className="flex-1 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs"
                      />
                      <span className="text-[10px] font-mono text-slate-500">ID: {stg.id}</span>
                    </div>

                    <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                      <select
                        disabled={!canEditDraft}
                        value={stg.stageKind}
                        onChange={(e) => {
                          const updated = [...draftStages];
                          updated[idx].stageKind = e.target.value as StageKind;
                          setDraftStages(updated);
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs"
                      >
                        <option value="intake">Intake</option>
                        <option value="operation">Operation</option>
                        <option value="inspection">Inspection</option>
                        <option value="rework">Rework</option>
                        <option value="completion">Completion</option>
                      </select>

                      {canEditDraft && draftStages.length > 2 && (
                        <button
                          type="button"
                          onClick={() => setDraftStages(draftStages.filter((_, i) => i !== idx))}
                          className="p-1.5 text-slate-400 hover:text-rose-400 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: UNITS OF MEASURE */}
          {activeTab === 'units' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Configured Measurement Units</h3>
                  <p className="text-xs text-slate-400">
                    Precision defines decimal rounding (e.g. 0 for pcs, 2 for kg/sqft).
                  </p>
                </div>
                {canEditDraft && (
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
                      setDraftUnits([...draftUnits, newUnit]);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center space-x-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Unit</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {draftUnits.map((u, idx) => (
                  <div key={u.id} className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700 flex items-center justify-between gap-3 text-xs">
                    <input
                      type="text"
                      disabled={!canEditDraft}
                      value={u.label}
                      onChange={(e) => {
                        const updated = [...draftUnits];
                        updated[idx].label = e.target.value;
                        setDraftUnits(updated);
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs w-32"
                    />
                    <input
                      type="text"
                      disabled={!canEditDraft}
                      value={u.symbol}
                      onChange={(e) => {
                        const updated = [...draftUnits];
                        updated[idx].symbol = e.target.value;
                        setDraftUnits(updated);
                      }}
                      className="px-2 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs w-14 font-mono text-center"
                    />
                    <span className="text-[10px] text-slate-400 font-mono">Prec: {u.precision}</span>
                    {canEditDraft && draftUnits.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setDraftUnits(draftUnits.filter((_, i) => i !== idx))}
                        className="p-1 text-slate-400 hover:text-rose-400 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: CUSTOM FIELDS */}
          {activeTab === 'fields' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Custom Fields for Production Jobs</h3>
                  <p className="text-xs text-slate-400">
                    Add custom job attributes (e.g. Wood Species, Stitch Pattern, Customer PO).
                  </p>
                </div>
                {canEditDraft && (
                  <button
                    type="button"
                    onClick={() => {
                      const newFld: FieldDefinition = {
                        id: `field_${Date.now()}`,
                        label: 'New Field',
                        entityType: 'job',
                        inputType: 'text',
                        required: false,
                      };
                      setDraftFields([...draftFields, newFld]);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center space-x-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Field</span>
                  </button>
                )}
              </div>

              <div className="space-y-2.5">
                {draftFields.map((f, idx) => (
                  <div key={f.id} className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700 flex items-center justify-between gap-3 text-xs">
                    <input
                      type="text"
                      disabled={!canEditDraft}
                      value={f.label}
                      onChange={(e) => {
                        const updated = [...draftFields];
                        updated[idx].label = e.target.value;
                        setDraftFields(updated);
                      }}
                      className="flex-1 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs"
                    />

                    <select
                      disabled={!canEditDraft}
                      value={f.inputType}
                      onChange={(e) => {
                        const updated = [...draftFields];
                        updated[idx].inputType = e.target.value as any;
                        setDraftFields(updated);
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs"
                    >
                      <option value="text">Text</option>
                      <option value="number">Number</option>
                      <option value="date">Date</option>
                      <option value="dropdown">Dropdown</option>
                      <option value="checkbox">Checkbox</option>
                    </select>

                    {canEditDraft && (
                      <button
                        type="button"
                        onClick={() => setDraftFields(draftFields.filter((_, i) => i !== idx))}
                        className="p-1.5 text-slate-400 hover:text-rose-400 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: TEAM & PERMISSIONS (COMPANY OWNER DELEGATION) */}
          {activeTab === 'team' && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-bold text-white">Team Members &amp; Access Control</h3>
                    <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-bold">
                      Owner Delegation
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    As the Company Owner, decide who gets access to what within this factory. Grant or restrict web desktop vs mobile floor app access, sensitive finance/payroll visibility, and functional modules.
                  </p>
                </div>

                {canManageTeam && !isEditingMember && (
                  <button
                    type="button"
                    onClick={handleOpenAddMember}
                    className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center space-x-1.5 transition-colors self-start shrink-0 cursor-pointer shadow-md shadow-indigo-600/20"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Add Member</span>
                  </button>
                )}
              </div>

              {/* Add / Edit Member Form Drawer */}
              {isEditingMember && (
                <form onSubmit={handleSaveMember} className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-700">
                    <span className="font-bold text-xs text-white">
                      {editingUserId ? 'Edit Member Access & Permissions' : 'Add New Team Member'}
                    </span>
                    <button data-dialog-close
                      type="button"
                      onClick={() => { setIsEditingMember(false); setEditingUserId(null); }}
                      className="text-slate-400 hover:text-white text-xs"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="text-[11px] font-bold text-slate-300 block mb-1">Full Name *</label>
                      <input
                        type="text"
                        required
                        value={formMemberName}
                        onChange={(e) => setFormMemberName(e.target.value)}
                        placeholder="e.g. Ramesh Patel"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-300 block mb-1">Employee ID / Badge *</label>
                      <input
                        type="text"
                        required
                        value={formMemberCode}
                        onChange={(e) => setFormMemberCode(e.target.value)}
                        placeholder="e.g. OP-101"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-300 block mb-1">Google Email (Optional for Google Sign-In)</label>
                      <input
                        type="email"
                        value={formMemberEmail}
                        onChange={(e) => setFormMemberEmail(e.target.value)}
                        placeholder="e.g. ramesh@gmail.com"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-300 block mb-1">Login Password (For Credentials Login)</label>
                      <input
                        type="text"
                        value={formMemberPassword}
                        onChange={(e) => setFormMemberPassword(e.target.value)}
                        placeholder="Default: pass@123"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Role Selection */}
                  <div className="space-y-1.5 pt-1">
                    <label className="text-[11px] font-bold text-slate-300 block">Assigned Role</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {[
                        { id: 'factory_admin' as const, label: 'Factory Admin', desc: 'Can configure settings, supervise floor & manage team' },
                        { id: 'operator' as const, label: 'Floor Operator', desc: 'Can advance workflow jobs, record production & stock' },
                        { id: 'viewer' as const, label: 'Viewer / Client', desc: 'Read-only viewing of jobs and inventory status' }
                      ].map(r => (
                        <div
                          key={r.id}
                          onClick={() => setFormMemberRole(r.id)}
                          className={`p-3 rounded-xl border cursor-pointer transition-all ${
                            formMemberRole === r.id
                              ? 'bg-indigo-600/20 border-indigo-500 text-white'
                              : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'
                          }`}
                        >
                          <div className="font-bold text-xs flex items-center justify-between">
                            <span>{r.label}</span>
                            {formMemberRole === r.id && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                          </div>
                          <p className="text-[10px] text-slate-400 mt-1 leading-snug">{r.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Device & Platform Access Privileges */}
                  <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-700 space-y-2">
                    <span className="text-[11px] font-bold text-slate-300 uppercase block tracking-wider">
                      Platform Access Privileges (Owner Controlled)
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                      <label className="flex items-center space-x-2.5 p-2 rounded-lg bg-slate-800/80 border border-slate-700/80 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formMemberWebAccess}
                          onChange={(e) => setFormMemberWebAccess(e.target.checked)}
                          className="rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        <div className="flex items-center space-x-1.5 text-slate-200">
                          <Globe className="w-3.5 h-3.5 text-blue-400" />
                          <span className="font-bold text-[11px]">Desktop Web ERP</span>
                        </div>
                      </label>

                      <label className="flex items-center space-x-2.5 p-2 rounded-lg bg-slate-800/80 border border-slate-700/80 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formMemberMobileAccess}
                          onChange={(e) => setFormMemberMobileAccess(e.target.checked)}
                          className="rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        <div className="flex items-center space-x-1.5 text-slate-200">
                          <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="font-bold text-[11px]">Mobile Floor App</span>
                        </div>
                      </label>

                      <label className="flex items-center space-x-2.5 p-2 rounded-lg bg-slate-800/80 border border-slate-700/80 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formMemberFinancialAccess}
                          onChange={(e) => setFormMemberFinancialAccess(e.target.checked)}
                          className="rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        <div className="flex items-center space-x-1.5 text-slate-200">
                          <Shield className="w-3.5 h-3.5 text-amber-400" />
                          <span className="font-bold text-[11px]">Financial / Payroll</span>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Module Access Checkboxes */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-300 block">Functional Modules Access</label>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                      {[
                        { id: 'workflow' as ModuleId, label: 'Workflow' },
                        { id: 'inventory' as ModuleId, label: 'Inventory' },
                        { id: 'dispatch' as ModuleId, label: 'Dispatch' },
                        { id: 'finance' as ModuleId, label: 'Finance' },
                        { id: 'machines' as ModuleId, label: 'Machines' }
                      ].map(mod => {
                        const isChecked = formMemberModules.includes(mod.id);
                        return (
                          <label
                            key={mod.id}
                            className={`p-2 rounded-lg border flex items-center space-x-2 cursor-pointer transition-colors ${
                              isChecked
                                ? 'bg-indigo-950/40 border-indigo-600 text-indigo-300 font-bold'
                                : 'bg-slate-900 border-slate-700 text-slate-400'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormMemberModules([...formMemberModules, mod.id]);
                                } else {
                                  setFormMemberModules(formMemberModules.filter(m => m !== mod.id));
                                }
                              }}
                              className="rounded text-indigo-600"
                            />
                            <span className="text-[11px] capitalize">{mod.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-700">
                    <button data-dialog-close
                      type="button"
                      onClick={() => { setIsEditingMember(false); setEditingUserId(null); }}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingMember}
                      className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center space-x-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{isSavingMember ? 'Saving Permissions...' : 'Save Permissions'}</span>
                    </button>
                  </div>
                </form>
              )}

              {/* Team Members List */}
              <div className="space-y-2.5">
                {loadingTeam ? (
                  <div className="p-8 text-center text-xs text-slate-400">Loading team members...</div>
                ) : (teamMembers.length === 0 && employeesList.length === 0) ? (
                  <div className="p-8 rounded-2xl bg-slate-800/40 border border-slate-700/60 text-center text-xs text-slate-400">
                    No team members configured yet. Click &quot;Add Member&quot; to give your employees access.
                  </div>
                ) : (
                  // Unified list
                  (() => {
                    const seenIds = new Set<string>();
                    const unifiedList: Array<{
                      userId: string;
                      name: string;
                      email?: string;
                      code: string;
                      role: string;
                      webAccess: boolean;
                      mobileAccess: boolean;
                      financialAccess: boolean;
                      modules: string[];
                      status: string;
                      membershipRecord?: UserMembership;
                    }> = [];

                    // 1. Memberships
                    teamMembers.forEach(m => {
                      seenIds.add(m.userId);
                      unifiedList.push({
                        userId: m.userId,
                        name: m.name,
                        email: m.email,
                        code: m.employeeCode || m.userId,
                        role: m.role,
                        webAccess: m.webAccess !== false,
                        mobileAccess: m.mobileAccess !== false,
                        financialAccess: Boolean(m.financialAccess),
                        modules: m.permittedModules || ['workflow', 'inventory'],
                        status: m.status,
                        membershipRecord: m
                      });
                    });

                    // 2. Employees not yet in memberships
                    employeesList.forEach(e => {
                      const idKey = e.id || e.employeeId;
                      if (!seenIds.has(idKey) && !unifiedList.some(u => u.code === e.employeeId)) {
                        seenIds.add(idKey);
                        unifiedList.push({
                          userId: idKey,
                          name: e.name,
                          email: e.googleEmail,
                          code: e.employeeId,
                          role: e.role?.toLowerCase().includes('admin') ? 'factory_admin' : (e.role?.toLowerCase().includes('owner') ? 'company_owner' : 'operator'),
                          webAccess: e.webAccess !== false,
                          mobileAccess: e.mobileAccess !== false,
                          financialAccess: Boolean(e.financialAccess),
                          modules: ['workflow', 'inventory', 'dispatch'],
                          status: 'active'
                        });
                      }
                    });

                    return unifiedList.map(member => (
                      <div
                        key={member.userId}
                        className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-white text-sm">{member.name}</span>
                            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-700">
                              {member.code}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                              member.role === 'company_owner'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : member.role === 'factory_admin'
                                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                                : 'bg-slate-700 text-slate-300'
                            }`}>
                              {member.role.replace('_', ' ')}
                            </span>
                          </div>

                          <div className="text-[11px] text-slate-400">
                            {member.email ? <span>{member.email}</span> : <span className="italic">No Google ID (Code / PIN login)</span>}
                          </div>

                          {/* Permission Pills */}
                          <div className="flex flex-wrap items-center gap-1.5 pt-1">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                              member.webAccess ? 'bg-blue-500/20 text-blue-300' : 'bg-slate-800 text-slate-500 line-through'
                            }`}>
                              Web ERP
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                              member.mobileAccess ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-500 line-through'
                            }`}>
                              Mobile App
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                              member.financialAccess ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-500 line-through'
                            }`}>
                              Finance
                            </span>
                            <span className="text-[9px] text-slate-400 font-mono">
                              Modules: {member.modules.join(', ')}
                            </span>
                          </div>
                        </div>

                        {canManageTeam && member.role !== 'company_owner' && (
                          <div className="flex items-center space-x-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                handleEditMember(member.membershipRecord || {
                                  userId: member.userId,
                                  name: member.name,
                                  email: member.email || '',
                                  employeeCode: member.code,
                                  role: member.role as UserRole,
                                  companyId: config.companyId,
                                  permittedFactoryIds: [config.factoryId],
                                  webAccess: member.webAccess,
                                  mobileAccess: member.mobileAccess,
                                  financialAccess: member.financialAccess,
                                  permittedModules: member.modules as ModuleId[],
                                  status: member.status as any
                                });
                              }}
                              className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-bold flex items-center space-x-1 cursor-pointer transition-colors"
                              title="Edit Access & Permissions"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Edit Access</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteMember(member.userId, member.code, member.email)}
                              className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 text-xs font-bold cursor-pointer transition-colors"
                              title="Revoke Access"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    ));
                  })()
                )}
              </div>
            </div>
          )}

          {/* TAB 4: VERSION HISTORY */}
          {activeTab === 'versions' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white">Immutable Version History</h3>
                <p className="text-xs text-slate-400">
                  Audit log of all published workflow versions for this factory site.
                </p>
              </div>

              <div className="space-y-3">
                {config.workflowVersions.map((v) => {
                  const isActive = v.versionId === config.activeWorkflowVersionId;
                  return (
                    <div
                      key={v.versionId}
                      className={`p-4 rounded-2xl border flex items-center justify-between text-xs ${
                        isActive
                          ? 'bg-indigo-950/30 border-indigo-500/60'
                          : 'bg-slate-800/40 border-slate-700/60'
                      }`}
                    >
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-white">{v.name}</span>
                          <span className="font-mono text-[10px] text-slate-400">({v.versionId})</span>
                          {isActive && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase">
                              Active Version
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">
                          {v.stages.length} Stages · Published {v.publishedAt ? new Date(v.publishedAt).toLocaleString() : 'Initial'} by {v.publishedBy || 'admin'}
                        </p>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span className="text-[11px] text-slate-400 font-mono">
                          {v.stages.map((s) => s.shortName).join(' ➔ ')}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t border-slate-800 flex items-center justify-between bg-slate-950/60">
          <button
            type="button"
            data-dialog-close onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Close
          </button>

          {canPublish && (
            <button
              type="button"
              disabled={isPublishing}
              onClick={handlePublishNewVersion}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center space-x-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isPublishing ? 'Publishing...' : 'Publish New Version'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

