import React, { useState, useEffect } from 'react';
import {
  Building2,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Layers,
  Settings,
  RefreshCw,
  Search,
  Filter,
  ArrowRight,
  TrendingUp,
  Cpu,
  Key,
  Users,
  Box,
  FileText,
  Sliders,
  DollarSign,
  Sparkles,
  ChevronRight,
  Lock,
  UserCheck,
  Edit3
} from 'lucide-react';
import { CompanyWorkspace } from '../../types';
import { ALL_FACTORY_TEMPLATES } from '../../templates/registry';
import { tenantRepository } from '../../services/repositories/tenantRepository';
import { TenantEntitlements, PlanTier } from '../../domain/configuration/types';
import { fetchCloudFactories, toggleFactoryPauseStatus, saveCloudFactory } from '../../services/cloudDbService';

interface PlatformAdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserEmail?: string;
  isSuperAdmin: boolean;
  onSelectWorkspace?: (workspace: CompanyWorkspace) => void;
}

export const PlatformAdminPanel: React.FC<PlatformAdminPanelProps> = ({
  isOpen,
  onClose,
  currentUserEmail,
  isSuperAdmin,
  onSelectWorkspace
}) => {
  const [activeTab, setActiveTab] = useState<'companies' | 'templates' | 'subscriptions' | 'audit'>('companies');
  const [companies, setCompanies] = useState<CompanyWorkspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPlan, setFilterPlan] = useState<string>('all');
  const [selectedCompany, setSelectedCompany] = useState<CompanyWorkspace | null>(null);
  const [entitlements, setEntitlements] = useState<TenantEntitlements | null>(null);
  const [isUpdatingEntitlements, setIsUpdatingEntitlements] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Company Owner Assignment State
  const [isEditingOwner, setIsEditingOwner] = useState(false);
  const [ownerNameInput, setOwnerNameInput] = useState('');
  const [ownerEmailInput, setOwnerEmailInput] = useState('');
  const [ownerPasswordInput, setOwnerPasswordInput] = useState('');
  const [isSavingOwner, setIsSavingOwner] = useState(false);

  const tenantRepo = tenantRepository;

  useEffect(() => {
    if (isOpen) {
      loadPlatformData();
    }
  }, [isOpen]);

  const loadPlatformData = async () => {
    setLoading(true);
    try {
      const list = await fetchCloudFactories();
      setCompanies(list);
      if (list.length > 0 && !selectedCompany) {
        setSelectedCompany(list[0]);
        setOwnerNameInput(list[0].ownerName || '');
        setOwnerEmailInput(list[0].ownerEmail || '');
        setOwnerPasswordInput(list[0].ownerPassword || '');
        loadCompanyEntitlements(list[0].id || list[0].code);
      }
    } catch (err) {
      console.error('Failed to load platform factories:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadCompanyEntitlements = async (companyId: string) => {
    const ent = await tenantRepo.getEntitlements(companyId);
    setEntitlements(ent);
  };

  const handleSelectCompany = (comp: CompanyWorkspace) => {
    setSelectedCompany(comp);
    setOwnerNameInput(comp.ownerName || '');
    setOwnerEmailInput(comp.ownerEmail || '');
    setOwnerPasswordInput(comp.ownerPassword || '');
    setIsEditingOwner(false);
    loadCompanyEntitlements(comp.id || comp.code);
  };

  const handleAssignCompanyOwner = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedCompany) return;
    const cleanEmail = ownerEmailInput.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      alert('Please enter a valid owner email address.');
      return;
    }

    setIsSavingOwner(true);
    try {
      const cleanName = ownerNameInput.trim() || 'Company Owner';
      const cleanPass = ownerPasswordInput.trim() || selectedCompany.ownerPassword || 'admin@123';

      const updatedComp: CompanyWorkspace = {
        ...selectedCompany,
        ownerName: cleanName,
        ownerEmail: cleanEmail,
        ownerPassword: cleanPass
      };

      // 1. Update cloud registry
      const updatedList = await saveCloudFactory(updatedComp);
      setCompanies(updatedList);
      setSelectedCompany(updatedComp);

      // 2. Persist company record in tenantRepository
      const compId = updatedComp.id || updatedComp.code.toLowerCase();
      await tenantRepo.saveCompany({
        id: compId,
        name: updatedComp.name,
        code: updatedComp.code,
        ownerEmail: cleanEmail,
        createdAt: selectedCompany.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      // 3. Register user membership as company_owner
      const ownerUserId = cleanEmail.replace(/[^a-zA-Z0-9_-]/g, '_');
      await tenantRepo.saveMembership({
        userId: ownerUserId,
        email: cleanEmail,
        name: cleanName,
        companyId: compId,
        role: 'company_owner',
        permittedFactoryIds: ['*'],
        financialAccess: true,
        webAccess: true,
        mobileAccess: true,
        status: 'active'
      });

      setIsEditingOwner(false);
      setStatusMessage(`Company Owner assigned! ${cleanName} (${cleanEmail}) now has full executive authority to manage team access and factory settings for "${updatedComp.name}".`);
      setTimeout(() => setStatusMessage(null), 5000);
    } catch (err: any) {
      alert(`Failed to assign owner: ${err?.message || err}`);
    } finally {
      setIsSavingOwner(false);
    }
  };

  const handleToggleSuspend = async (comp: CompanyWorkspace) => {
    const isPaused = !comp.dataEntryPaused && comp.planStatus !== 'suspended';
    const actionLabel = isPaused ? 'suspend' : 'reinstate';
    if (!window.confirm(`Are you sure you want to ${actionLabel} access for "${comp.name}"?`)) {
      return;
    }

    try {
      const updatedList = await toggleFactoryPauseStatus(
        comp.code,
        isPaused,
        isPaused ? 'Administrative hold by Platform Super Admin' : undefined
      );
      setCompanies(updatedList);
      const updatedComp = updatedList.find(c => c.code === comp.code);
      if (updatedComp) {
        setSelectedCompany(updatedComp);
      }

      // Also update tenant repository entitlements status
      if (entitlements) {
        const updatedEnt: TenantEntitlements = {
          ...entitlements,
          planStatus: isPaused ? 'suspended' : 'active'
        };
        await tenantRepo.saveEntitlements(updatedEnt);
        setEntitlements(updatedEnt);
      }

      setStatusMessage(`Tenant "${comp.name}" successfully ${isPaused ? 'suspended' : 'reinstated'}.`);
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: any) {
      alert(`Action failed: ${err.message || err}`);
    }
  };

  const handleUpdatePlanTier = async (newTier: PlanTier) => {
    if (!selectedCompany || !entitlements) return;
    setIsUpdatingEntitlements(true);

    try {
      const quotaDefaults = {
        trial: { maxUsers: 3, maxFactories: 1, maxActiveJobs: 20, storageQuotaMb: 500 },
        starter: { maxUsers: 5, maxFactories: 1, maxActiveJobs: 50, storageQuotaMb: 1000 },
        growth: { maxUsers: 25, maxFactories: 3, maxActiveJobs: 500, storageQuotaMb: 10000 },
        enterprise: { maxUsers: 999, maxFactories: 50, maxActiveJobs: 99999, storageQuotaMb: 100000 }
      }[newTier];

      const updated: TenantEntitlements = {
        ...entitlements,
        planTier: newTier,
        maxUsers: quotaDefaults.maxUsers,
        maxFactories: quotaDefaults.maxFactories,
        maxActiveJobs: quotaDefaults.maxActiveJobs,
        storageQuotaMb: quotaDefaults.storageQuotaMb
      };

      await tenantRepo.saveEntitlements(updated);
      setEntitlements(updated);
      setStatusMessage(`Plan tier updated to ${newTier.toUpperCase()} with refreshed capacity quotas.`);
      setTimeout(() => setStatusMessage(null), 3500);
    } catch (err: any) {
      alert(`Failed to update tier: ${err.message || err}`);
    } finally {
      setIsUpdatingEntitlements(false);
    }
  };

  if (!isOpen) return null;

  if (!isSuperAdmin) {
    return (
      <div className="tf-dialog-layer fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl max-w-md w-full p-6 text-center shadow-2xl border border-rose-200">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Access Restricted</h3>
          <p className="text-xs text-slate-500 mt-2 mb-6">
            The Platform Administration Console is restricted to verified vendor super administrators. Your account (<span className="font-mono text-slate-700">{currentUserEmail || 'Anonymous'}</span>) does not possess root platform privileges.
          </p>
          <button
            type="button"
            data-dialog-close onClick={onClose}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>
    );
  }

  const filteredCompanies = companies.filter(c => {
    const q = searchQuery.toLowerCase().trim();
    const matchQuery = !q || c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q) || (c.ownerEmail || '').toLowerCase().includes(q);
    const isSuspended = c.dataEntryPaused || c.planStatus === 'suspended';
    const matchPlan = filterPlan === 'all' || (filterPlan === 'paused' && isSuspended) || (filterPlan === 'active' && !isSuspended);
    return matchQuery && matchPlan;
  });

  return (
    <div className="tf-dialog-layer fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 select-none animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-6xl w-full h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Top Header */}
        <div className="p-5 bg-slate-950 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-black tracking-tight text-white">Platform Administration Console</h2>
                <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-mono font-bold uppercase border border-amber-400/30">
                  Vendor Super Admin
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Central multi-tenant governance, subscription entitlements, template catalog &amp; client factory fleet
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={loadPlatformData}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors text-xs flex items-center space-x-1.5"
              title="Refresh Fleet Data"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              type="button"
              data-dialog-close onClick={onClose}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors"
            >
              Close
            </button>
          </div>
        </div>

        {/* Global Alert Notification */}
        {statusMessage && (
          <div className="bg-emerald-500 text-white px-4 py-2 text-xs font-bold flex items-center justify-between">
            <span>{statusMessage}</span>
            <button type="button" onClick={() => setStatusMessage(null)} className="hover:opacity-75">✕</button>
          </div>
        )}

        {/* Main Body with Left Tabs and Right Workspace */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-slate-50">
          {/* Navigation Sub-Tabs */}
          <div className="w-full md:w-56 bg-white border-r border-slate-200 p-3 flex md:flex-col space-x-2 md:space-x-0 md:space-y-1.5 overflow-x-auto shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('companies')}
              className={`w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors text-left ${
                activeTab === 'companies'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Building2 className="h-4 w-4" />
              <span>Tenant Fleet ({companies.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('templates')}
              className={`w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors text-left ${
                activeTab === 'templates'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Layers className="h-4 w-4" />
              <span>Template Catalog ({ALL_FACTORY_TEMPLATES.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('subscriptions')}
              className={`w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors text-left ${
                activeTab === 'subscriptions'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <DollarSign className="h-4 w-4" />
              <span>Plans &amp; Entitlements</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('audit')}
              className={`w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors text-left ${
                activeTab === 'audit'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <FileText className="h-4 w-4" />
              <span>Platform Health</span>
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {/* VIEW 1: TENANT FLEET */}
            {activeTab === 'companies' && (
              <div className="space-y-6">
                {/* Search & Filter Bar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200">
                  <div className="relative flex-1">
                    <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search tenants by name, code, or owner email..."
                      className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Filter className="h-3.5 w-3.5 text-slate-400" />
                    <select
                      value={filterPlan}
                      onChange={(e) => setFilterPlan(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:outline-none"
                    >
                      <option value="all">All Statuses</option>
                      <option value="active">Active Only</option>
                      <option value="paused">Suspended Only</option>
                    </select>
                  </div>
                </div>

                {/* Split View: Fleet Table & Selected Detail Inspector */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left: Tenant List */}
                  <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
                    <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-bold text-slate-600">
                      <span>Registered Workspaces ({filteredCompanies.length})</span>
                      <span className="text-[11px] font-normal text-slate-500">Click to inspect</span>
                    </div>

                    <div className="divide-y divide-slate-100 max-h-[520px] overflow-y-auto">
                      {filteredCompanies.length === 0 ? (
                        <div className="p-8 text-center text-xs text-slate-400">
                          No company workspaces found matching criteria.
                        </div>
                      ) : (
                        filteredCompanies.map(c => {
                          const isSelected = selectedCompany?.code === c.code;
                          const isFlagship = c.code === 'TRISHARTH-HQ';

                          return (
                            <div
                              key={c.id || c.code}
                              onClick={() => handleSelectCompany(c)}
                              className={`p-3.5 flex items-center justify-between cursor-pointer transition-colors ${
                                isSelected ? 'bg-blue-50/70 border-l-4 border-blue-600' : 'hover:bg-slate-50/80'
                              }`}
                            >
                              <div className="space-y-1">
                                <div className="flex items-center space-x-2">
                                  <span className="font-bold text-xs text-slate-900">{c.name}</span>
                                  <span className="font-mono text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200 font-bold">
                                    {c.code}
                                  </span>
                                  {isFlagship && (
                                    <span className="text-[9px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                                      Flagship
                                    </span>
                                  )}
                                  {(c.dataEntryPaused || c.planStatus === 'suspended') ? (
                                    <span className="text-[9px] font-bold bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded flex items-center space-x-0.5">
                                      <XCircle className="w-2.5 h-2.5" />
                                      <span>Suspended</span>
                                    </span>
                                  ) : (
                                    <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded flex items-center space-x-0.5">
                                      <CheckCircle2 className="w-2.5 h-2.5" />
                                      <span>Active</span>
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-500">
                                  Owner: <span className="font-medium text-slate-700">{c.ownerName || 'Director'}</span> ({c.ownerEmail || 'No email'})
                                </div>
                              </div>

                              <ChevronRight className={`h-4 w-4 text-slate-400 ${isSelected ? 'text-blue-600 translate-x-1' : ''} transition-transform`} />
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Right: Selected Tenant Inspector */}
                  <div className="lg:col-span-5 space-y-4">
                    {selectedCompany ? (
                      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
                        <div className="flex items-start justify-between pb-3 border-b border-slate-200">
                          <div>
                            <h3 className="font-black text-sm text-slate-900">{selectedCompany.name}</h3>
                            <span className="font-mono text-xs text-slate-500 font-bold">{selectedCompany.code}</span>
                          </div>

                          {selectedCompany.code !== 'TRISHARTH-HQ' && (
                            <button
                              type="button"
                              onClick={() => handleToggleSuspend(selectedCompany)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                                (selectedCompany.dataEntryPaused || selectedCompany.planStatus === 'suspended')
                                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                  : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                              }`}
                            >
                              {(selectedCompany.dataEntryPaused || selectedCompany.planStatus === 'suspended') ? 'Reinstate Tenant' : 'Suspend Tenant'}
                            </button>
                          )}
                        </div>

                        {/* Designated Company Owner & Authority Section */}
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <UserCheck className="h-4 w-4 text-indigo-600" />
                              <span className="text-xs font-bold text-slate-800">Designated Company Owner</span>
                            </div>
                            {!isEditingOwner && (
                              <button
                                type="button"
                                onClick={() => {
                                  setOwnerNameInput(selectedCompany.ownerName || '');
                                  setOwnerEmailInput(selectedCompany.ownerEmail || '');
                                  setOwnerPasswordInput(selectedCompany.ownerPassword || '');
                                  setIsEditingOwner(true);
                                }}
                                className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1 cursor-pointer"
                              >
                                <Edit3 className="h-3 w-3" />
                                <span>{selectedCompany.ownerEmail ? 'Reassign Owner' : 'Assign Owner'}</span>
                              </button>
                            )}
                          </div>

                          {isEditingOwner ? (
                            <form onSubmit={handleAssignCompanyOwner} className="space-y-2.5 pt-1">
                              <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Owner Full Name</label>
                                <input
                                  type="text"
                                  required
                                  value={ownerNameInput}
                                  onChange={(e) => setOwnerNameInput(e.target.value)}
                                  placeholder="e.g. Atharva Balar"
                                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-indigo-600 focus:outline-none"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Owner Google / Sign-In Email</label>
                                <input
                                  type="email"
                                  required
                                  value={ownerEmailInput}
                                  onChange={(e) => setOwnerEmailInput(e.target.value)}
                                  placeholder="e.g. owner@factory.com"
                                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-indigo-600 focus:outline-none"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Initial Password (Optional)</label>
                                <input
                                  type="text"
                                  value={ownerPasswordInput}
                                  onChange={(e) => setOwnerPasswordInput(e.target.value)}
                                  placeholder="Default: admin@123"
                                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-indigo-600 focus:outline-none"
                                />
                              </div>
                              <div className="flex items-center space-x-2 pt-1">
                                <button
                                  type="submit"
                                  disabled={isSavingOwner}
                                  className="flex-1 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors flex items-center justify-center space-x-1"
                                >
                                  {isSavingOwner ? <span>Assigning...</span> : <span>Save &amp; Delegate Ownership</span>}
                                </button>
                                <button data-dialog-close
                                  type="button"
                                  onClick={() => setIsEditingOwner(false)}
                                  className="px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            </form>
                          ) : (
                            <div className="space-y-1.5 text-xs">
                              <div className="flex items-center justify-between">
                                <span className="text-slate-500">Name:</span>
                                <span className="font-bold text-slate-800">{selectedCompany.ownerName || 'Not Assigned'}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-slate-500">Email:</span>
                                <span className="font-mono font-medium text-slate-700">{selectedCompany.ownerEmail || 'Not Configured'}</span>
                              </div>
                              <p className="text-[10px] text-slate-400 pt-1 leading-snug">
                                Trishil Balar assigns the Company Owner here. The Company Owner can then configure who gets access to what within their factory workspace.
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Entitlement Quotas & Tier Controls */}
                        <div className="space-y-3">
                          <div className="text-xs font-bold text-slate-700 flex items-center justify-between">
                            <span>Subscription Tier</span>
                            <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-900 text-[10px] font-black uppercase">
                              {entitlements?.planTier || 'Growth'}
                            </span>
                          </div>

                          <div className="grid grid-cols-3 gap-2">
                            {(['starter', 'growth', 'enterprise'] as const).map(tier => (
                              <button
                                key={tier}
                                type="button"
                                disabled={isUpdatingEntitlements}
                                onClick={() => handleUpdatePlanTier(tier)}
                                className={`py-2 px-1 rounded-xl text-[11px] font-bold border transition-colors capitalize ${
                                  (entitlements?.planTier || 'growth') === tier
                                    ? 'bg-slate-900 text-white border-slate-900'
                                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                                }`}
                              >
                                {tier}
                              </button>
                            ))}
                          </div>

                          {/* Quota Limits Grid */}
                          <div className="grid grid-cols-2 gap-2 pt-2 text-xs">
                            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                              <span className="text-[10px] font-bold text-slate-400 block uppercase">Max Users / Seats</span>
                              <span className="font-mono font-bold text-slate-800 text-sm">
                                {entitlements?.maxUsers || 25} Users
                              </span>
                            </div>
                            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                              <span className="text-[10px] font-bold text-slate-400 block uppercase">Max Factories</span>
                              <span className="font-mono font-bold text-slate-800 text-sm">
                                {entitlements?.maxFactories || 3} Sites
                              </span>
                            </div>
                            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                              <span className="text-[10px] font-bold text-slate-400 block uppercase">Active Job Limit</span>
                              <span className="font-mono font-bold text-slate-800 text-sm">
                                {entitlements?.maxActiveJobs || 500} Jobs
                              </span>
                            </div>
                            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                              <span className="text-[10px] font-bold text-slate-400 block uppercase">Cloud Storage</span>
                              <span className="font-mono font-bold text-slate-800 text-sm">
                                {((entitlements?.storageQuotaMb || 10000) / 1024).toFixed(1)} GB
                              </span>
                            </div>
                          </div>

                          {/* Switch To Workspace Action */}
                          {onSelectWorkspace && (
                            <button
                              type="button"
                              onClick={() => {
                                onSelectWorkspace(selectedCompany);
                                onClose();
                              }}
                              className="w-full mt-3 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center space-x-1.5"
                            >
                              <span>Impersonate / Enter Factory Workspace</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center text-xs text-slate-400">
                        Select a company from the list to manage entitlements.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* VIEW 2: TEMPLATE CATALOG */}
            {activeTab === 'templates' && (
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-200">
                  <h3 className="font-bold text-sm text-slate-900">Curated Factory Templates</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Official blueprints available to client companies during self-service onboarding or workspace resets.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {ALL_FACTORY_TEMPLATES.map(tpl => (
                    <div key={tpl.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-black text-sm text-slate-900">{tpl.name}</span>
                          <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold">
                            {tpl.id}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 line-clamp-3">
                          {tpl.description}
                        </p>

                        <div className="space-y-1.5 pt-2">
                          <div className="text-[11px] font-bold text-slate-700">
                            Workflow Stages ({tpl.workflow.stages.length}):
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {tpl.workflow.stages.map((st, i) => (
                              <span key={st.id} className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200 font-medium">
                                {i + 1}. {st.shortName}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-1.5 pt-2">
                          <div className="text-[11px] font-bold text-slate-700">Supported Units:</div>
                          <div className="flex flex-wrap gap-1">
                            {tpl.units.map(u => (
                              <span key={u.id} className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-800 font-mono">
                                {u.label} ({u.symbol})
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 font-mono">
                        Authoritative version: {tpl.workflow.workflowId}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* VIEW 3: PLANS & ENTITLEMENTS */}
            {activeTab === 'subscriptions' && (
              <div className="space-y-6">
                <div className="bg-white p-4 rounded-2xl border border-slate-200">
                  <h3 className="font-bold text-sm text-slate-900">Standard Tier Specifications</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Tier pricing, seat allowances, and module entitlement matrix applied across tenant workspaces.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Starter Tier */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
                    <div className="pb-3 border-b border-slate-100">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Entry Tier</span>
                      <h4 className="text-base font-black text-slate-900 mt-1">Starter</h4>
                      <p className="text-xs text-slate-500 mt-1">Ideal for small workshops and single-site units.</p>
                      <div className="text-lg font-black text-slate-900 mt-3">₹2,999 <span className="text-xs font-normal text-slate-400">/ mo</span></div>
                    </div>
                    <ul className="space-y-2 text-xs text-slate-600">
                      <li className="flex items-center space-x-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Up to 5 Users / Operators</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>1 Factory Location</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>50 Active Job Orders</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Workflow &amp; Inventory Modules</span>
                      </li>
                    </ul>
                  </div>

                  {/* Professional Tier */}
                  <div className="bg-white rounded-2xl border-2 border-blue-500 p-5 shadow-sm space-y-4 relative">
                    <div className="absolute -top-3 right-4 bg-blue-600 text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full">
                      Most Popular
                    </div>
                    <div className="pb-3 border-b border-slate-100">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">Standard Growth</span>
                      <h4 className="text-base font-black text-slate-900 mt-1">Professional</h4>
                      <p className="text-xs text-slate-500 mt-1">Full multi-department factory automation.</p>
                      <div className="text-lg font-black text-slate-900 mt-3">₹7,999 <span className="text-xs font-normal text-slate-400">/ mo</span></div>
                    </div>
                    <ul className="space-y-2 text-xs text-slate-600">
                      <li className="flex items-center space-x-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                        <span>Up to 25 Users &amp; Floor Supervisors</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                        <span>3 Connected Factory Units</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                        <span>500 Active Production Batches</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                        <span>All 5 Modules (Dispatch, Finance &amp; IoT)</span>
                      </li>
                    </ul>
                  </div>

                  {/* Enterprise Tier */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
                    <div className="pb-3 border-b border-slate-100">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Custom Fleet</span>
                      <h4 className="text-base font-black text-slate-900 mt-1">Enterprise</h4>
                      <p className="text-xs text-slate-500 mt-1">Large multi-plant manufacturing enterprises.</p>
                      <div className="text-lg font-black text-slate-900 mt-3">Custom <span className="text-xs font-normal text-slate-400">/ SLA</span></div>
                    </div>
                    <ul className="space-y-2 text-xs text-slate-600">
                      <li className="flex items-center space-x-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Unlimited Users &amp; Roles</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Unlimited Factory Sites</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Custom ERP Integrations &amp; SLAs</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Dedicated Database Cluster</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* VIEW 4: PLATFORM HEALTH */}
            {activeTab === 'audit' && (
              <div className="space-y-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900">Platform System Health: Operational</h3>
                      <p className="text-xs text-slate-500">Multi-tenant Cloud Database isolation and sync listeners active.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Active Tenants</span>
                      <span className="font-bold text-slate-800 text-base">{companies.filter(c => !c.dataEntryPaused && c.planStatus !== 'suspended').length} Active Sites</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Security Isolation</span>
                      <span className="font-bold text-emerald-700 text-base">Firestore Rule v2 Guarded</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Templates Loaded</span>
                      <span className="font-bold text-slate-800 text-base">{ALL_FACTORY_TEMPLATES.length} Canonical Blueprints</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
