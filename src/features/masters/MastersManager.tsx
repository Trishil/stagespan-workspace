import React, { useState, useEffect } from 'react';
import {
  SlidersHorizontal,
  Workflow,
  Layers,
  Sliders,
  Users,
  Plus,
  Trash2,
  Edit2,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Save,
  Globe,
  Smartphone,
  Shield,
  Check,
  UserPlus,
  RefreshCw,
  GitBranch,
  Box,
  Palette,
  Eye,
  Info
} from 'lucide-react';
import { 
  FactoryConfiguration, 
  WorkflowVersion, 
  StageDefinitionConfig, 
  StageKind, 
  FieldDefinition, 
  UnitDefinition, 
  ModuleId 
} from '../../domain/configuration/types';
import { validateWorkflowVersion } from '../../domain/workflow/validator';
import { UserMembership, UserRole } from '../../domain/permissions/types';
import { tenantRepository } from '../../services/repositories/tenantRepository';
import { fetchCloudFinanceEmployees, saveCloudFinance } from '../../services/cloudDbService';
import { CompanyWorkspace, AuthUser, EmployeeRecord } from '../../types';

interface MastersManagerProps {
  config: FactoryConfiguration;
  membership: UserMembership | null;
  currentUser: AuthUser | null;
  activeWorkspace: CompanyWorkspace;
  onConfigUpdated: (newConfig: FactoryConfiguration) => void;
}

const PRESET_STAGE_TEMPLATES = [
  {
    label: 'Dyeing',
    shortName: 'DYE',
    stageKind: 'operation' as StageKind,
    description: 'Fabric reactive or pigment dyeing process in jet / jigger machine',
    color: {
      bg: 'bg-indigo-50/70',
      border: 'border-indigo-300',
      text: 'text-indigo-950',
      badge: 'bg-indigo-100 text-indigo-800 border border-indigo-200',
      headerBg: 'bg-indigo-100/70'
    }
  },
  {
    label: 'Washing & Scouring',
    shortName: 'WASH',
    stageKind: 'operation' as StageKind,
    description: 'Post-dyeing neutralizing wash and soft water rinse',
    color: {
      bg: 'bg-cyan-50/70',
      border: 'border-cyan-300',
      text: 'text-cyan-950',
      badge: 'bg-cyan-100 text-cyan-800 border border-cyan-200',
      headerBg: 'bg-cyan-100/70'
    }
  },
  {
    label: 'Printing Process',
    shortName: 'PRINT',
    stageKind: 'operation' as StageKind,
    description: 'Rotary screen or digital textile printing',
    color: {
      bg: 'bg-purple-50/70',
      border: 'border-purple-300',
      text: 'text-purple-950',
      badge: 'bg-purple-100 text-purple-800 border border-purple-200',
      headerBg: 'bg-purple-100/70'
    }
  },
  {
    label: 'Heat Press / Curing',
    shortName: 'HEAT',
    stageKind: 'operation' as StageKind,
    description: 'High-temperature thermal fixation and curing',
    color: {
      bg: 'bg-amber-50/70',
      border: 'border-amber-300',
      text: 'text-amber-950',
      badge: 'bg-amber-100 text-amber-800 border border-amber-200',
      headerBg: 'bg-amber-100/70'
    }
  }
];

const COLOR_PALETTES = [
  { name: 'Indigo Blue', bg: 'bg-indigo-50/70', border: 'border-indigo-300', text: 'text-indigo-950', badge: 'bg-indigo-100 text-indigo-800 border border-indigo-200', headerBg: 'bg-indigo-100/70' },
  { name: 'Emerald Green', bg: 'bg-emerald-50/70', border: 'border-emerald-300', text: 'text-emerald-950', badge: 'bg-emerald-100 text-emerald-800 border border-emerald-200', headerBg: 'bg-emerald-100/70' },
  { name: 'Amber Gold', bg: 'bg-amber-50/70', border: 'border-amber-300', text: 'text-amber-950', badge: 'bg-amber-100 text-amber-800 border border-amber-200', headerBg: 'bg-amber-100/70' },
  { name: 'Cyan Sky', bg: 'bg-cyan-50/70', border: 'border-cyan-300', text: 'text-cyan-950', badge: 'bg-cyan-100 text-cyan-800 border border-cyan-200', headerBg: 'bg-cyan-100/70' },
  { name: 'Purple Violet', bg: 'bg-purple-50/70', border: 'border-purple-300', text: 'text-purple-950', badge: 'bg-purple-100 text-purple-800 border border-purple-200', headerBg: 'bg-purple-100/70' },
  { name: 'Rose Red', bg: 'bg-rose-50/70', border: 'border-rose-300', text: 'text-rose-950', badge: 'bg-rose-100 text-rose-800 border border-rose-200', headerBg: 'bg-rose-100/70' },
  { name: 'Slate Neutral', bg: 'bg-slate-50/70', border: 'border-slate-300', text: 'text-slate-950', badge: 'bg-slate-100 text-slate-800 border border-slate-200', headerBg: 'bg-slate-100/70' }
];

export const MastersManager: React.FC<MastersManagerProps> = ({
  config,
  membership,
  currentUser,
  activeWorkspace,
  onConfigUpdated
}) => {
  const [activeSection, setActiveSection] = useState<'stages' | 'units' | 'fields' | 'team'>('stages');

  // Stages & Columns Master state
  const activeWf = config.workflowVersions.find(v => v.versionId === config.activeWorkflowVersionId) || config.workflowVersions[0];
  const [draftStages, setDraftStages] = useState<StageDefinitionConfig[]>(() => {
    return activeWf ? JSON.parse(JSON.stringify(activeWf.stages)) : [];
  });

  // Modal / Drawer for stage editing
  const [isEditingStage, setIsEditingStage] = useState(false);
  const [editingStageId, setEditingStageId] = useState<string | null>(null);
  const [stageFormLabel, setStageFormLabel] = useState('');
  const [stageFormShortName, setStageFormShortName] = useState('');
  const [stageFormKind, setStageFormKind] = useState<StageKind>('operation');
  const [stageFormDescription, setStageFormDescription] = useState('');
  const [stageFormColorIdx, setStageFormColorIdx] = useState(0);
  const [stageFormInsertIndex, setStageFormInsertIndex] = useState<number>(-1);

  // Units Master state
  const [draftUnits, setDraftUnits] = useState<UnitDefinition[]>(() => JSON.parse(JSON.stringify(config.units || [])));
  const [newUnitName, setNewUnitName] = useState('');
  const [newUnitCode, setNewUnitCode] = useState('');
  const [newUnitPrecision, setNewUnitPrecision] = useState(0);

  // Custom Fields Master state
  const [draftFields, setDraftFields] = useState<FieldDefinition[]>(() => JSON.parse(JSON.stringify(config.customFields || [])));
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldKey, setNewFieldKey] = useState('');
  const [newFieldType, setNewFieldType] = useState<'text' | 'number' | 'select' | 'boolean'>('text');

  // Team Master state
  const [teamMembers, setTeamMembers] = useState<UserMembership[]>([]);
  const [employeesList, setEmployeesList] = useState<EmployeeRecord[]>([]);
  const [loadingTeam, setLoadingTeam] = useState(false);
  const [isEditingMember, setIsEditingMember] = useState(false);
  const [editingMemberUserId, setEditingMemberUserId] = useState<string | null>(null);
  const [formMemberName, setFormMemberName] = useState('');
  const [formMemberEmail, setFormMemberEmail] = useState('');
  const [formMemberCode, setFormMemberCode] = useState('');
  const [formMemberPassword, setFormMemberPassword] = useState('pass@123');
  const [formMemberRole, setFormMemberRole] = useState<UserRole>('operator');
  const [formMemberWebAccess, setFormMemberWebAccess] = useState(true);
  const [formMemberMobileAccess, setFormMemberMobileAccess] = useState(true);
  const [formMemberFinancialAccess, setFormMemberFinancialAccess] = useState(false);
  const [formMemberModules, setFormMemberModules] = useState<ModuleId[]>(['workflow', 'inventory']);

  // Global State
  const [isSaving, setIsSaving] = useState(false);
  const [statusNotification, setStatusNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Reload draft stages when config changes externally
  useEffect(() => {
    const curWf = config.workflowVersions.find(v => v.versionId === config.activeWorkflowVersionId) || config.workflowVersions[0];
    if (curWf) {
      setDraftStages(JSON.parse(JSON.stringify(curWf.stages)));
    }
    setDraftUnits(JSON.parse(JSON.stringify(config.units || [])));
    setDraftFields(JSON.parse(JSON.stringify(config.customFields || [])));
  }, [config]);

  // Load team data when team section is selected
  useEffect(() => {
    if (activeSection === 'team') {
      loadTeam();
    }
  }, [activeSection]);

  const loadTeam = async () => {
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

  // --- STAGE MASTER ACTIONS ---

  const handleOpenAddStage = (preset?: typeof PRESET_STAGE_TEMPLATES[0]) => {
    setEditingStageId(null);
    if (preset) {
      setStageFormLabel(preset.label);
      setStageFormShortName(preset.shortName);
      setStageFormKind(preset.stageKind);
      setStageFormDescription(preset.description);
      const cIdx = COLOR_PALETTES.findIndex(c => c.border === preset.color.border);
      setStageFormColorIdx(cIdx >= 0 ? cIdx : 0);
    } else {
      setStageFormLabel(`Process Stage ${draftStages.length + 1}`);
      setStageFormShortName(`S${draftStages.length + 1}`);
      setStageFormKind('operation');
      setStageFormDescription('');
      setStageFormColorIdx(draftStages.length % COLOR_PALETTES.length);
    }
    setStageFormInsertIndex(draftStages.length);
    setIsEditingStage(true);
  };

  const handleOpenEditStage = (stg: StageDefinitionConfig, index: number) => {
    setEditingStageId(stg.id);
    setStageFormLabel(stg.label);
    setStageFormShortName(stg.shortName || stg.label.slice(0, 4).toUpperCase());
    setStageFormKind(stg.stageKind);
    setStageFormDescription(stg.description || '');
    const cIdx = COLOR_PALETTES.findIndex(c => c.border === stg.color?.border);
    setStageFormColorIdx(cIdx >= 0 ? cIdx : 0);
    setStageFormInsertIndex(index);
    setIsEditingStage(true);
  };

  const handleSaveStageForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stageFormLabel.trim()) {
      alert('Please enter a stage label / column name');
      return;
    }

    const selectedPalette = COLOR_PALETTES[stageFormColorIdx] || COLOR_PALETTES[0];
    const cleanShort = (stageFormShortName.trim() || stageFormLabel.trim().slice(0, 4)).toUpperCase();

    if (editingStageId) {
      // Editing existing stage
      const updated = draftStages.map(s => {
        if (s.id !== editingStageId) return s;
        return {
          ...s,
          label: stageFormLabel.trim(),
          shortName: cleanShort,
          stageKind: stageFormKind,
          description: stageFormDescription.trim(),
          color: selectedPalette,
        };
      });
      setDraftStages(updated);
    } else {
      // Adding new stage
      const newId = `stg_${stageFormLabel.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now().toString().slice(-4)}`;
      const newStage: StageDefinitionConfig = {
        id: newId,
        label: stageFormLabel.trim(),
        shortName: cleanShort,
        stageKind: stageFormKind,
        order: draftStages.length + 1,
        color: selectedPalette,
        iconName: stageFormKind === 'inspection' ? 'ShieldCheck' : (stageFormKind === 'rework' ? 'Wrench' : 'Layers'),
        description: stageFormDescription.trim(),
        allowedTransitionStageIds: [],
      };

      const copy = [...draftStages];
      const insertAt = stageFormInsertIndex >= 0 && stageFormInsertIndex <= copy.length
        ? stageFormInsertIndex
        : copy.length;
      copy.splice(insertAt, 0, newStage);

      // Re-index orders
      const reindexed = copy.map((st, idx) => ({ ...st, order: idx + 1 }));
      setDraftStages(reindexed);
    }

    setIsEditingStage(false);
    setEditingStageId(null);
  };

  const handleMoveStage = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === draftStages.length - 1) return;

    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    const copy = [...draftStages];
    const [moved] = copy.splice(index, 1);
    copy.splice(targetIdx, 0, moved);

    const reindexed = copy.map((st, idx) => ({ ...st, order: idx + 1 }));
    setDraftStages(reindexed);
  };

  const handleDeleteStage = (id: string, label: string) => {
    if (draftStages.length <= 2) {
      alert('A workflow must maintain at least 2 stages (Intake and Completion).');
      return;
    }
    if (!window.confirm(`Are you sure you want to remove the column/stage "${label}" from the workflow master?`)) {
      return;
    }
    const filtered = draftStages.filter(s => s.id !== id);
    const reindexed = filtered.map((st, idx) => ({ ...st, order: idx + 1 }));
    setDraftStages(reindexed);
  };

  // --- PUBLISH STAGES TO FACTORY PIPELINE ---
  const handlePublishStagesToFactory = async () => {
    if (draftStages.length < 2) {
      setStatusNotification({ type: 'error', text: 'Workflow must have at least 2 stages.' });
      return;
    }

    setIsSaving(true);
    setStatusNotification(null);

    const newVersionNumber = (activeWf?.versionNumber || 1) + 1;
    const newVersionId = `wf_${config.factoryId}_v${newVersionNumber}_${Date.now()}`;

    const newWorkflowVersion: WorkflowVersion = {
      workflowId: activeWf?.workflowId || `wf_${config.factoryId}`,
      versionId: newVersionId,
      versionNumber: newVersionNumber,
      name: `${config.factoryName} Master Workflow (v${newVersionNumber})`,
      stages: draftStages,
      initialStageId: draftStages[0]?.id || 'fabric',
      completionStageId: draftStages[draftStages.length - 1]?.id || 'prepare_dispatch',
      isPublished: true,
      publishedAt: new Date().toISOString(),
      publishedBy: currentUser?.email || 'Company Owner',
    };

    const valResult = validateWorkflowVersion(newWorkflowVersion);
    if (!valResult.isValid) {
      setStatusNotification({ type: 'error', text: `Stage validation error: ${valResult.errors.join('; ')}` });
      setIsSaving(false);
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
        updatedBy: currentUser?.email || 'Company Owner',
      };

      await tenantRepository.saveFactoryConfiguration(updatedConfig);
      onConfigUpdated(updatedConfig);
      setStatusNotification({
        type: 'success',
        text: `Success! Published ${draftStages.length} stages (Version ${newVersionNumber}). All Kanban columns, Piece Matrix, and Floor Trackers now reflect this dynamic pipeline!`
      });
    } catch (err: any) {
      setStatusNotification({ type: 'error', text: `Failed to apply master stages: ${err?.message || err}` });
    } finally {
      setIsSaving(false);
    }
  };

  // --- UNITS MASTER ACTIONS ---
  const handleAddUnit = () => {
    if (!newUnitName.trim() || !newUnitCode.trim()) {
      alert('Please enter unit name and unit code');
      return;
    }
    const newUnit: UnitDefinition = {
      id: `unit_${newUnitCode.toLowerCase().trim()}`,
      label: newUnitName.trim(),
      symbol: newUnitCode.toUpperCase().trim(),
      dimension: 'count',
      precision: Number(newUnitPrecision) || 0,
      isDefault: draftUnits.length === 0,
    };
    setDraftUnits([...draftUnits, newUnit]);
    setNewUnitName('');
    setNewUnitCode('');
    setNewUnitPrecision(0);
  };

  const handleDeleteUnit = (id: string) => {
    if (draftUnits.length <= 1) {
      alert('At least one unit of measure is required.');
      return;
    }
    setDraftUnits(draftUnits.filter(u => u.id !== id));
  };

  // --- CUSTOM FIELDS MASTER ACTIONS ---
  const handleAddField = () => {
    if (!newFieldName.trim() || !newFieldKey.trim()) {
      alert('Please enter field name and field key');
      return;
    }
    const cleanKey = newFieldKey.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    const newField: FieldDefinition = {
      id: cleanKey,
      label: newFieldName.trim(),
      entityType: 'job',
      inputType: (newFieldType === 'select' ? 'dropdown' : newFieldType === 'boolean' ? 'checkbox' : newFieldType) as any,
      required: false,
    };
    setDraftFields([...draftFields, newField]);
    setNewFieldName('');
    setNewFieldKey('');
  };

  const handleDeleteField = (id: string) => {
    setDraftFields(draftFields.filter(f => f.id !== id));
  };

  // --- TEAM MASTER ACTIONS ---
  const handleOpenAddMember = () => {
    setEditingMemberUserId(null);
    setFormMemberName('');
    setFormMemberEmail('');
    setFormMemberCode(`EMP-${Math.floor(100 + Math.random() * 900)}`);
    setFormMemberPassword('pass@123');
    setFormMemberRole('operator');
    setFormMemberWebAccess(true);
    setFormMemberMobileAccess(true);
    setFormMemberFinancialAccess(false);
    setFormMemberModules(['workflow', 'inventory']);
    setIsEditingMember(true);
  };

  const handleOpenEditMember = (m: UserMembership) => {
    setEditingMemberUserId(m.userId);
    setFormMemberName(m.name);
    setFormMemberEmail(m.email);
    setFormMemberCode(m.employeeCode || m.userId);
    setFormMemberRole(m.role);
    setFormMemberWebAccess(m.webAccess !== false);
    setFormMemberMobileAccess(m.mobileAccess !== false);
    setFormMemberFinancialAccess(Boolean(m.financialAccess));
    setFormMemberModules(m.permittedModules || ['workflow', 'inventory']);

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

    try {
      const cleanEmail = formMemberEmail.trim().toLowerCase();
      const cleanCode = formMemberCode.trim().toUpperCase() || `EMP-${Date.now().toString().slice(-4)}`;
      const targetUserId = editingMemberUserId || (cleanEmail ? cleanEmail.replace(/[^a-zA-Z0-9_-]/g, '_') : `user_${Date.now()}`);

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
        status: 'active'
      };

      await tenantRepository.saveMembership(newMembership);

      // Sync to cloud finance employee roster
      const existingIdx = employeesList.findIndex(e =>
        (e.employeeId && e.employeeId.toUpperCase() === cleanCode) ||
        (cleanEmail && e.googleEmail && e.googleEmail.toLowerCase() === cleanEmail)
      );

      let updatedEmps: EmployeeRecord[];
      if (existingIdx >= 0) {
        updatedEmps = employeesList.map((emp, idx) => {
          if (idx !== existingIdx) return emp;
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
      await loadTeam();

      setIsEditingMember(false);
      setEditingMemberUserId(null);
      setStatusNotification({
        type: 'success',
        text: `Permissions saved for "${formMemberName.trim()}". Access rules are live immediately.`
      });
    } catch (err: any) {
      setStatusNotification({ type: 'error', text: `Failed to save member: ${err?.message || err}` });
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
      await loadTeam();
      setStatusNotification({ type: 'success', text: 'Team member removed and access revoked.' });
    } catch (err: any) {
      setStatusNotification({ type: 'error', text: `Failed to delete member: ${err?.message || err}` });
    }
  };

  return (
    <div className="space-y-6 pb-12 select-none animate-fadeIn">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20 shrink-0">
            <SlidersHorizontal className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-black text-slate-900 tracking-tight">Factory Masters &amp; Column Control</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-mono font-bold uppercase">
                Owner Console
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Add and customize stages, add dynamic columns like Dyeing, manage units, custom fields, and control team access for <strong>{activeWorkspace.name}</strong> ({activeWorkspace.code}).
            </p>
          </div>
        </div>

        {/* Action Button to Save Stages */}
        {activeSection === 'stages' && (
          <button
            type="button"
            disabled={isSaving}
            onClick={handlePublishStagesToFactory}
            className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/30 flex items-center space-x-2 transition-all cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isSaving ? 'Applying Pipeline...' : 'Save & Apply Pipeline'}</span>
          </button>
        )}
      </div>

      {/* Global Status Notification */}
      {statusNotification && (
        <div
          className={`p-4 rounded-2xl text-xs font-medium flex items-center justify-between shadow-xs ${
            statusNotification.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
              : 'bg-rose-50 text-rose-900 border border-rose-200'
          }`}
        >
          <div className="flex items-center space-x-2">
            {statusNotification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{statusNotification.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusNotification(null)}
            className="text-xs font-bold px-2 py-0.5 rounded hover:bg-black/5"
          >
            ✕
          </button>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {[
          { id: 'stages' as const, label: 'Stages & Columns Master', icon: Workflow, badge: `${draftStages.length} Stages` },
          { id: 'units' as const, label: 'Units of Measure Master', icon: Layers, badge: `${draftUnits.length} Units` },
          { id: 'fields' as const, label: 'Custom Job Fields Master', icon: Sliders, badge: `${draftFields.length} Fields` },
          { id: 'team' as const, label: 'Team & Permissions Master', icon: Users, badge: `${teamMembers.length || employeesList.length} Staff` },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeSection === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSection(tab.id)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer shrink-0 ${
                isActive
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/80'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
                {tab.badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: STAGES & COLUMNS MASTER (DYNAMIC MANUFACTURING STEPS) */}
      {/* ========================================================================= */}
      {activeSection === 'stages' && (
        <div className="space-y-6">
          {/* Quick Preset Stage Addition Cards */}
          <div className="bg-indigo-50/50 border border-indigo-100 rounded-3xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-bold text-slate-800">Quick-Add Common Factory Stages</span>
              </div>
              <span className="text-[11px] text-slate-500">Click to instantly add stage to sequence</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {PRESET_STAGE_TEMPLATES.map(preset => {
                const alreadyExists = draftStages.some(s => s.label.toLowerCase() === preset.label.toLowerCase() || s.shortName === preset.shortName);
                return (
                  <button
                    key={preset.label}
                    type="button"
                    disabled={alreadyExists}
                    onClick={() => handleOpenAddStage(preset)}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      alreadyExists
                        ? 'bg-slate-100 border-slate-200 text-slate-400 opacity-60 cursor-not-allowed'
                        : 'bg-white border-indigo-200 hover:border-indigo-400 hover:shadow-xs cursor-pointer group'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900 group-hover:text-indigo-600 transition-colors">
                        + {preset.label}
                      </span>
                      <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-slate-100 text-slate-600 font-bold">
                        {preset.shortName}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1 line-clamp-1">{preset.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pipeline Stages Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <div>
              <h3 className="font-black text-sm text-slate-900 flex items-center space-x-2">
                <span>Active Pipeline Sequence</span>
                <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                  {draftStages.length} Columns
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Jobs flow sequentially from Step 1 to Step {draftStages.length}. You can reorder, edit, or add columns anywhere.
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleOpenAddStage()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center space-x-1.5 transition-colors self-start cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Custom Column</span>
            </button>
          </div>

          {/* Stage Edit / Add Modal */}
          {isEditingStage && (
            <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
              <form onSubmit={handleSaveStageForm} className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-sm font-black text-slate-900">
                      {editingStageId ? 'Edit Stage Column' : 'Add New Workflow Stage Column'}
                    </h3>
                    <p className="text-[11px] text-slate-500">Configure how this stage appears across Kanban &amp; Matrix</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setIsEditingStage(false); setEditingStageId(null); }}
                    className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 text-sm"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Stage / Column Name *</label>
                    <input
                      type="text"
                      required
                      value={stageFormLabel}
                      onChange={(e) => setStageFormLabel(e.target.value)}
                      placeholder="e.g. Dyeing, Washing, Printing"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 text-slate-900 font-bold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Short Code / Badge</label>
                      <input
                        type="text"
                        maxLength={6}
                        value={stageFormShortName}
                        onChange={(e) => setStageFormShortName(e.target.value)}
                        placeholder="e.g. DYE"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 text-slate-900 font-mono font-bold uppercase"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Stage Kind</label>
                      <select
                        value={stageFormKind}
                        onChange={(e) => setStageFormKind(e.target.value as StageKind)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 text-slate-900 font-medium"
                      >
                        <option value="operation">Operation (Work Process)</option>
                        <option value="intake">Intake (Material Inward)</option>
                        <option value="inspection">Inspection (Quality Check)</option>
                        <option value="rework">Rework (Altering / Repair)</option>
                        <option value="completion">Completion (Ready to Ship)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Color Palette (Kanban Column Header)</label>
                    <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                      {COLOR_PALETTES.map((palette, idx) => (
                        <div
                          key={palette.name}
                          onClick={() => setStageFormColorIdx(idx)}
                          className={`p-2 rounded-xl border flex flex-col items-center justify-center cursor-pointer transition-all ${
                            stageFormColorIdx === idx
                              ? 'ring-2 ring-indigo-600 scale-105 shadow-sm'
                              : 'hover:border-slate-400'
                          } ${palette.bg}`}
                        >
                          <div className={`w-5 h-5 rounded-full ${palette.headerBg} border ${palette.border}`} />
                          <span className="text-[9px] font-bold text-slate-700 mt-1 truncate w-full text-center">
                            {palette.name.split(' ')[0]}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Process Description / Instructions</label>
                    <textarea
                      rows={2}
                      value={stageFormDescription}
                      onChange={(e) => setStageFormDescription(e.target.value)}
                      placeholder="e.g. Dyeing with reactive dye in soft-flow machine. Check color swatch before unloading."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 text-slate-900"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => { setIsEditingStage(false); setEditingStageId(null); }}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors shadow-md shadow-indigo-600/20"
                  >
                    {editingStageId ? 'Update Column' : 'Add Column to Pipeline'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Sequential Stages List */}
          <div className="space-y-3">
            {draftStages.map((stage, idx) => {
              const isFirst = idx === 0;
              const isLast = idx === draftStages.length - 1;

              return (
                <div
                  key={stage.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs hover:shadow-xs ${
                    stage.color?.bg || 'bg-white'
                  } ${stage.color?.border || 'border-slate-200'}`}
                >
                  <div className="flex items-center space-x-3.5 flex-1">
                    {/* Step Number Badge */}
                    <div className="w-8 h-8 rounded-xl bg-slate-900 text-white font-black text-xs flex items-center justify-center shrink-0 font-mono shadow-2xs">
                      {idx + 1}
                    </div>

                    <div className="space-y-1 flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-black text-sm text-slate-900">{stage.label}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-black ${stage.color?.badge || 'bg-slate-100 text-slate-800'}`}>
                          {stage.shortName || stage.id}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-slate-200/80 text-slate-700">
                          {stage.stageKind}
                        </span>
                      </div>

                      {stage.description && (
                        <p className="text-[11px] text-slate-600 leading-snug">{stage.description}</p>
                      )}
                    </div>
                  </div>

                  {/* Move & Edit Actions */}
                  <div className="flex items-center space-x-1.5 shrink-0 self-end sm:self-center">
                    <button
                      type="button"
                      disabled={isFirst}
                      onClick={() => handleMoveStage(idx, 'up')}
                      className="p-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      title="Move Step Up (Earlier in sequence)"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      disabled={isLast}
                      onClick={() => handleMoveStage(idx, 'down')}
                      className="p-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      title="Move Step Down (Later in sequence)"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenEditStage(stage, idx)}
                      className="p-2 rounded-xl bg-white hover:bg-slate-100 text-blue-600 border border-slate-200 transition-colors flex items-center space-x-1 text-xs font-bold"
                      title="Edit Stage Details"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Edit</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteStage(stage.id, stage.label)}
                      className="p-2 rounded-xl bg-white hover:bg-rose-50 text-rose-600 border border-slate-200 transition-colors"
                      title="Delete Stage Column"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: UNITS OF MEASURE MASTER */}
      {/* ========================================================================= */}
      {activeSection === 'units' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <div>
              <h3 className="font-black text-sm text-slate-900">Units of Measure Master</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Define the units used for inventory stock, production batches, and job counts (e.g. Pieces, Meters, Rolls, Kg).
              </p>
            </div>

            {/* Add New Unit Row */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs items-end">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Unit Name</label>
                <input
                  type="text"
                  value={newUnitName}
                  onChange={(e) => setNewUnitName(e.target.value)}
                  placeholder="e.g. Kilograms, Yards"
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Unit Code / Symbol</label>
                <input
                  type="text"
                  value={newUnitCode}
                  onChange={(e) => setNewUnitCode(e.target.value)}
                  placeholder="e.g. KG, YD"
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono font-bold uppercase"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Decimal Precision</label>
                <select
                  value={newUnitPrecision}
                  onChange={(e) => setNewUnitPrecision(Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-medium"
                >
                  <option value={0}>0 Decimals (Whole units like pieces)</option>
                  <option value={1}>1 Decimal (0.1)</option>
                  <option value={2}>2 Decimals (0.01 like meters/kg)</option>
                  <option value={3}>3 Decimals (0.001)</option>
                </select>
              </div>

              <button
                type="button"
                onClick={handleAddUnit}
                className="py-1.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs transition-colors flex items-center justify-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Unit</span>
              </button>
            </div>

            {/* Units Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              {draftUnits.map(u => (
                <div key={u.id} className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between text-xs">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-900">{u.label}</span>
                      <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                        {u.symbol}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      Precision: {u.precision} decimal(s) {u.isDefault && '· Base Unit'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteUnit(u.id)}
                    className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 3: CUSTOM JOB FIELDS MASTER */}
      {/* ========================================================================= */}
      {activeSection === 'fields' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <div>
              <h3 className="font-black text-sm text-slate-900">Custom Job Fields Master</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Attach custom parameters to job slips and cards (e.g. Shrinkage %, Batch Lot Prefix, Machine ID, Shade Number).
              </p>
            </div>

            {/* Add Field Row */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs items-end">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Field Label</label>
                <input
                  type="text"
                  value={newFieldName}
                  onChange={(e) => setNewFieldName(e.target.value)}
                  placeholder="e.g. Shrinkage %"
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Field Key (Identifier)</label>
                <input
                  type="text"
                  value={newFieldKey}
                  onChange={(e) => setNewFieldKey(e.target.value)}
                  placeholder="e.g. shrinkage_pct"
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono font-medium lowercase"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Data Type</label>
                <select
                  value={newFieldType}
                  onChange={(e) => setNewFieldType(e.target.value as any)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-medium"
                >
                  <option value="text">Text</option>
                  <option value="number">Number</option>
                  <option value="select">Dropdown Select</option>
                  <option value="boolean">Toggle / Yes-No</option>
                </select>
              </div>

              <button
                type="button"
                onClick={handleAddField}
                className="py-1.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs transition-colors flex items-center justify-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Field</span>
              </button>
            </div>

            {/* Fields List */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              {draftFields.map(f => (
                <div key={f.id} className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between text-xs">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-900">{f.label}</span>
                      <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                        {f.id}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-0.5 block uppercase">
                      Type: {f.inputType}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteField(f.id)}
                    className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 4: TEAM & PERMISSIONS MASTER */}
      {/* ========================================================================= */}
      {activeSection === 'team' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-black text-sm text-slate-900">Factory Team &amp; Access Control Master</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  As the Company Owner, decide who gets access to what within this factory. Grant or restrict web desktop vs mobile app access, sensitive finance/payroll visibility, and functional modules.
                </p>
              </div>

              {!isEditingMember && (
                <button
                  type="button"
                  onClick={handleOpenAddMember}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center space-x-1.5 transition-colors self-start shrink-0 cursor-pointer shadow-xs"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Add Member</span>
                </button>
              )}
            </div>

            {/* Member Form Drawer */}
            {isEditingMember && (
              <form onSubmit={handleSaveMember} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4 animate-in fade-in">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <span className="font-bold text-xs text-slate-900">
                    {editingMemberUserId ? 'Edit Member Access & Permissions' : 'Add New Team Member'}
                  </span>
                  <button
                    type="button"
                    onClick={() => { setIsEditingMember(false); setEditingMemberUserId(null); }}
                    className="text-slate-400 hover:text-slate-700 text-xs"
                  >
                    Cancel
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={formMemberName}
                      onChange={(e) => setFormMemberName(e.target.value)}
                      placeholder="e.g. Ramesh Patel"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-medium"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Employee ID / Badge *</label>
                    <input
                      type="text"
                      required
                      value={formMemberCode}
                      onChange={(e) => setFormMemberCode(e.target.value)}
                      placeholder="e.g. OP-101"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Google Email (Optional for Google Sign-In)</label>
                    <input
                      type="email"
                      value={formMemberEmail}
                      onChange={(e) => setFormMemberEmail(e.target.value)}
                      placeholder="e.g. ramesh@gmail.com"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Login Password (For Credentials Login)</label>
                    <input
                      type="text"
                      value={formMemberPassword}
                      onChange={(e) => setFormMemberPassword(e.target.value)}
                      placeholder="Default: pass@123"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900"
                    />
                  </div>
                </div>

                {/* Role Selection */}
                <div className="space-y-1.5 pt-1">
                  <label className="text-[11px] font-bold text-slate-700 block">Assigned Role</label>
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
                            ? 'bg-indigo-50 border-indigo-500 text-indigo-950 shadow-2xs'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <div className="font-bold text-xs flex items-center justify-between">
                          <span>{r.label}</span>
                          {formMemberRole === r.id && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1 leading-snug">{r.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Device & Platform Access Privileges */}
                <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2">
                  <span className="text-[11px] font-bold text-slate-800 uppercase block tracking-wider">
                    Platform Access Privileges (Owner Controlled)
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    <label className="flex items-center space-x-2.5 p-2 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formMemberWebAccess}
                        onChange={(e) => setFormMemberWebAccess(e.target.checked)}
                        className="rounded text-indigo-600"
                      />
                      <div className="flex items-center space-x-1.5 text-slate-800">
                        <Globe className="w-3.5 h-3.5 text-blue-600" />
                        <span className="font-bold text-[11px]">Desktop Web ERP</span>
                      </div>
                    </label>

                    <label className="flex items-center space-x-2.5 p-2 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formMemberMobileAccess}
                        onChange={(e) => setFormMemberMobileAccess(e.target.checked)}
                        className="rounded text-indigo-600"
                      />
                      <div className="flex items-center space-x-1.5 text-slate-800">
                        <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="font-bold text-[11px]">Mobile Floor App</span>
                      </div>
                    </label>

                    <label className="flex items-center space-x-2.5 p-2 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formMemberFinancialAccess}
                        onChange={(e) => setFormMemberFinancialAccess(e.target.checked)}
                        className="rounded text-indigo-600"
                      />
                      <div className="flex items-center space-x-1.5 text-slate-800">
                        <Shield className="w-3.5 h-3.5 text-amber-600" />
                        <span className="font-bold text-[11px]">Financial / Payroll</span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Module Access Checkboxes */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 block">Functional Modules Access</label>
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
                              ? 'bg-indigo-50 border-indigo-400 text-indigo-900 font-bold'
                              : 'bg-white border-slate-200 text-slate-600'
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

                <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => { setIsEditingMember(false); setEditingMemberUserId(null); }}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Permissions</span>
                  </button>
                </div>
              </form>
            )}

            {/* Members List */}
            <div className="space-y-2.5">
              {loadingTeam ? (
                <div className="p-8 text-center text-xs text-slate-400">Loading team members...</div>
              ) : (
                (() => {
                  const seen = new Set<string>();
                  const list: Array<{
                    userId: string;
                    name: string;
                    email?: string;
                    code: string;
                    role: string;
                    webAccess: boolean;
                    mobileAccess: boolean;
                    financialAccess: boolean;
                    modules: string[];
                    membershipRecord?: UserMembership;
                  }> = [];

                  teamMembers.forEach(m => {
                    seen.add(m.userId);
                    list.push({
                      userId: m.userId,
                      name: m.name,
                      email: m.email,
                      code: m.employeeCode || m.userId,
                      role: m.role,
                      webAccess: m.webAccess !== false,
                      mobileAccess: m.mobileAccess !== false,
                      financialAccess: Boolean(m.financialAccess),
                      modules: m.permittedModules || ['workflow', 'inventory'],
                      membershipRecord: m
                    });
                  });

                  employeesList.forEach(e => {
                    const idKey = e.id || e.employeeId;
                    if (!seen.has(idKey) && !list.some(u => u.code === e.employeeId)) {
                      seen.add(idKey);
                      list.push({
                        userId: idKey,
                        name: e.name,
                        email: e.googleEmail,
                        code: e.employeeId,
                        role: e.role?.toLowerCase().includes('admin') ? 'factory_admin' : (e.role?.toLowerCase().includes('owner') ? 'company_owner' : 'operator'),
                        webAccess: e.webAccess !== false,
                        mobileAccess: e.mobileAccess !== false,
                        financialAccess: Boolean(e.financialAccess),
                        modules: ['workflow', 'inventory', 'dispatch'],
                      });
                    }
                  });

                  if (list.length === 0) {
                    return (
                      <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-400">
                        No team members configured yet. Click &quot;Add Member&quot; to give your employees access.
                      </div>
                    );
                  }

                  return list.map(member => (
                    <div
                      key={member.userId}
                      className="p-3.5 rounded-2xl bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs hover:border-slate-300 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-900 text-sm">{member.name}</span>
                          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                            {member.code}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                            member.role === 'company_owner'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : member.role === 'factory_admin'
                              ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {member.role.replace('_', ' ')}
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-500">
                          {member.email ? <span>{member.email}</span> : <span className="italic">Badge / PIN Login Only</span>}
                        </div>

                        {/* Permission Pills */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                            member.webAccess ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-slate-100 text-slate-400 line-through'
                          }`}>
                            Web ERP
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                            member.mobileAccess ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-400 line-through'
                          }`}>
                            Mobile Floor
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                            member.financialAccess ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-slate-100 text-slate-400 line-through'
                          }`}>
                            Finance
                          </span>
                          <span className="text-[9px] text-slate-500 font-mono">
                            Modules: {member.modules.join(', ')}
                          </span>
                        </div>
                      </div>

                      {member.role !== 'company_owner' && (
                        <div className="flex items-center space-x-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              handleOpenEditMember(member.membershipRecord || {
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
                                status: 'active'
                              });
                            }}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center space-x-1 cursor-pointer transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Edit Access</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteMember(member.userId, member.code, member.email)}
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold cursor-pointer transition-colors"
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
        </div>
      )}
    </div>
  );
};
