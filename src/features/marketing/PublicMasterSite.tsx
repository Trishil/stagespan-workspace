import React, { useState } from 'react';
import { 
  Building2, 
  Workflow, 
  Layers, 
  Truck, 
  Wallet, 
  Cpu, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  Play, 
  ChevronRight, 
  Package, 
  Scissors, 
  Hammer, 
  BarChart3, 
  Lock, 
  Sliders, 
  ExternalLink 
} from 'lucide-react';
import { ALL_FACTORY_TEMPLATES } from '../../templates/registry';
import { FactoryTemplate } from '../../domain/configuration/types';

interface PublicMasterSiteProps {
  onStartOnboarding: (templateId?: string) => void;
  onGoToLogin: () => void;
  onGoToPlatformAdmin?: () => void;
  isPlatformAdmin?: boolean;
}

export const PublicMasterSite: React.FC<PublicMasterSiteProps> = ({
  onStartOnboarding,
  onGoToLogin,
  onGoToPlatformAdmin,
  isPlatformAdmin,
}) => {
  const [selectedTemplateTab, setSelectedTemplateTab] = useState<string>('template_textile_v1');
  const activeTemplate: FactoryTemplate =
    ALL_FACTORY_TEMPLATES.find((t) => t.id === selectedTemplateTab) || ALL_FACTORY_TEMPLATES[0];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-md shadow-indigo-500/20 text-white font-black text-xl">
              F
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight text-white flex items-center space-x-1.5">
                <span>FactoryFlow</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  SaaS
                </span>
              </span>
              <p className="text-[11px] text-slate-400 font-medium -mt-1">Configurable Factory Management</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium text-slate-300">
            <a href="#features" className="hover:text-white transition-colors">Supported Modules</a>
            <a href="#templates" className="hover:text-white transition-colors">Templates</a>
            <a href="#architecture" className="hover:text-white transition-colors">How It Works</a>
            <a href="#pricing" className="hover:text-white transition-colors">Plans &amp; Capacity</a>
          </nav>

          <div className="flex items-center space-x-3">
            {isPlatformAdmin && onGoToPlatformAdmin && (
              <button
                type="button"
                onClick={onGoToPlatformAdmin}
                className="hidden sm:flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold hover:bg-amber-500/30 transition-colors"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Vendor Admin</span>
              </button>
            )}

            <button
              type="button"
              onClick={onGoToLogin}
              className="px-3.5 py-2 rounded-xl text-slate-300 hover:text-white text-xs font-semibold hover:bg-slate-800 transition-colors"
            >
              Sign In to Workspace
            </button>

            <button
              type="button"
              onClick={() => onStartOnboarding()}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 flex items-center space-x-1.5 transition-all transform active:scale-95"
            >
              <span>Create Factory</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-24 lg:pt-28 lg:pb-32 border-b border-slate-800/80">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99,102,241,0.18),rgba(255,255,255,0))]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Zero-code setup for custom manufacturing pipelines</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
              One Factory SaaS. <br />
              <span className="bg-gradient-to-r from-indigo-400 via-violet-300 to-pink-400 bg-clip-text text-transparent">
                Your Exact Stages &amp; Materials.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-400 font-normal leading-relaxed">
              Stop forcing your floor into rigid spreadsheets or generic software. Configure your own ordered stages,
              inspection gates, units, and custom fields — with instant preview and idempotent activation.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => onStartOnboarding()}
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 flex items-center justify-center space-x-2 transition-all transform hover:-translate-y-0.5 cursor-pointer"
              >
                <span>Launch Your Workspace in 3 Mins</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById('templates');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-200 font-bold text-sm flex items-center justify-center space-x-2 transition-all cursor-pointer"
              >
                <Sliders className="w-4 h-4 text-slate-400" />
                <span>Explore Starter Templates</span>
              </button>
            </div>

            <div className="pt-6 flex items-center justify-center gap-6 text-xs text-slate-400">
              <div className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Textile &amp; Furniture Templates Included</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Strict Tenant Isolation</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Web + Mobile Floor Sync</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Starter Templates Showcase */}
      <section id="templates" className="py-20 bg-slate-950/60 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Starter Industry Templates</h2>
            <p className="text-sm text-slate-400">
              Choose an installable blueprint or start completely blank. When installed, you get your own isolated copy that you can edit anytime.
            </p>
          </div>

          {/* Template Selector Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
            {ALL_FACTORY_TEMPLATES.map((tmpl) => (
              <button
                key={tmpl.id}
                type="button"
                onClick={() => setSelectedTemplateTab(tmpl.id)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
                  selectedTemplateTab === tmpl.id
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700/60'
                }`}
              >
                <span>{tmpl.name}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                  selectedTemplateTab === tmpl.id ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-700 text-slate-300'
                }`}>
                  {tmpl.workflow.stages.length} Stages
                </span>
              </button>
            ))}
          </div>

          {/* Active Template Card Preview */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
              <div>
                <span className="text-xs font-mono font-bold uppercase text-indigo-400 tracking-wider">
                  {activeTemplate.industry}
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-white mt-1">{activeTemplate.name}</h3>
                <p className="text-sm text-slate-400 mt-1 max-w-2xl">{activeTemplate.description}</p>
              </div>

              <button
                type="button"
                onClick={() => onStartOnboarding(activeTemplate.id)}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center space-x-1.5 shadow-md shadow-indigo-600/20 cursor-pointer shrink-0"
              >
                <span>Use This Template</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Stages Flow Preview */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Configured Workflow Stages ({activeTemplate.workflow.stages.length})
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {activeTemplate.workflow.stages.map((stg) => (
                  <div
                    key={stg.id}
                    className="p-3.5 rounded-xl bg-slate-800/70 border border-slate-700/60 flex flex-col justify-between space-y-2"
                  >
                    <div>
                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                        <span>Stage {stg.order}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] uppercase font-bold ${
                          stg.stageKind === 'inspection'
                            ? 'bg-amber-500/20 text-amber-300'
                            : stg.stageKind === 'rework'
                            ? 'bg-rose-500/20 text-rose-300'
                            : stg.stageKind === 'completion'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-indigo-500/20 text-indigo-300'
                        }`}>
                          {stg.stageKind}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-white mt-1 line-clamp-1">{stg.label}</p>
                    </div>
                    {stg.reworkStageId && (
                      <p className="text-[10px] text-rose-400 flex items-center space-x-1">
                        <span>Rework ➔ {stg.reworkStageId}</span>
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Units & Custom Fields Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-800 space-y-2">
                <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Configured Measurement Units</h5>
                <div className="flex flex-wrap gap-1.5">
                  {activeTemplate.units.map((u) => (
                    <span key={u.id} className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-xs font-mono">
                      {u.label} ({u.symbol})
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-800 space-y-2">
                <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Custom Fields</h5>
                <div className="flex flex-wrap gap-1.5">
                  {activeTemplate.customFields.map((f) => (
                    <span key={f.id} className="px-2.5 py-1 rounded-lg bg-indigo-950/60 border border-indigo-800/60 text-indigo-300 text-xs font-mono">
                      {f.label} ({f.inputType})
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Supported Modules Section */}
      <section id="features" className="py-20 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Choose Only The Modules You Need</h2>
            <p className="text-sm text-slate-400">
              Only pay for and see what your plant actually operates. You can enable additional modules as your business scales.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 hover:border-slate-700 transition-all">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                <Workflow className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Dynamic Workflow &amp; QC</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Visual Kanban pipeline conforming to your published stages. Supports individual unit-level barcodes or bulk batch quantities without floating-point drift.
              </p>
              <div className="pt-2 text-xs font-mono text-emerald-400 flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Available &amp; Configurable</span>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 hover:border-slate-700 transition-all">
              <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Inventory &amp; Real Consumption</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Raw materials, custom categories, stock bins, minimum threshold alerts, and real stock consumption deducted directly against production jobs.
              </p>
              <div className="pt-2 text-xs font-mono text-emerald-400 flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Available &amp; Configurable</span>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 hover:border-slate-700 transition-all">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                <Truck className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Dispatch &amp; Shipments</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Turn completed job units into delivery challans, customer shipping manifests, and track transit statuses from ready-to-dispatch to delivered.
              </p>
              <div className="pt-2 text-xs font-mono text-emerald-400 flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Available &amp; Configurable</span>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 hover:border-slate-700 transition-all">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
                <Wallet className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Staff Wages &amp; Payables</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Track employee monthly salaries, operational factory expenses, and supplier payables with strict role-gated financial permissions.
              </p>
              <div className="pt-2 text-xs font-mono text-slate-400 flex items-center space-x-1">
                <span>Legacy Template Feature</span>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 hover:border-slate-700 transition-all">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Machine Telemetry</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Monitor multi-head embroidery and CNC machinery RPM, operational speed modes, and live maintenance logs across factory bays.
              </p>
              <div className="pt-2 text-xs font-mono text-slate-400 flex items-center space-x-1">
                <span>Legacy Template Feature</span>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 hover:border-slate-700 transition-all">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Audit &amp; Version History</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Every workflow change creates an immutable version. Active jobs continue on their original version; new jobs inherit the latest published configuration.
              </p>
              <div className="pt-2 text-xs font-mono text-emerald-400 flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Built-in Invariant</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Transparent Plans & Capacity */}
      <section id="pricing" className="py-20 bg-slate-950/40 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Transparent Plans &amp; Capacity</h2>
            <p className="text-sm text-slate-400">
              Clear quotas for operating sites, team seats, and active jobs. (Pricing shown is for demo/trial quote purposes).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Starter */}
            <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-black text-white">Starter</h3>
                  <p className="text-xs text-slate-400 mt-1">Single workshop or pilot factory</p>
                </div>
                <div className="text-3xl font-black text-white">
                  ₹2,999 <span className="text-xs font-normal text-slate-400">/ month (Quote)</span>
                </div>
                <ul className="space-y-2.5 text-xs text-slate-300 pt-2 border-t border-slate-800">
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span><strong>1 Factory</strong> site</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Up to <strong>5 team members</strong></span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Workflow &amp; Inventory modules</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Up to <strong>100 active jobs</strong></span>
                  </li>
                </ul>
              </div>

              <button
                type="button"
                onClick={() => onStartOnboarding()}
                className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Start 14-Day Free Trial
              </button>
            </div>

            {/* Growth */}
            <div className="p-8 rounded-3xl bg-slate-900 border-2 border-indigo-500 relative flex flex-col justify-between space-y-6 shadow-2xl shadow-indigo-500/10">
              <div className="absolute -top-3 right-6 px-3 py-1 rounded-full bg-indigo-500 text-white text-[10px] font-black uppercase tracking-wider">
                Most Popular
              </div>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-black text-white">Growth</h3>
                  <p className="text-xs text-slate-400 mt-1">Multi-site expanding manufacturing plants</p>
                </div>
                <div className="text-3xl font-black text-white">
                  ₹7,999 <span className="text-xs font-normal text-slate-400">/ month (Quote)</span>
                </div>
                <ul className="space-y-2.5 text-xs text-slate-300 pt-2 border-t border-slate-800">
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Up to <strong>3 Factories</strong></span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Up to <strong>25 team members</strong></span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Workflow, Inventory &amp; <strong>Dispatch</strong></span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Up to <strong>500 active jobs</strong></span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Custom Fields &amp; Unit Precision</span>
                  </li>
                </ul>
              </div>

              <button
                type="button"
                onClick={() => onStartOnboarding()}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
              >
                Start Free Trial
              </button>
            </div>

            {/* Enterprise */}
            <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-black text-white">Enterprise</h3>
                  <p className="text-xs text-slate-400 mt-1">High-volume industrial manufacturing</p>
                </div>
                <div className="text-3xl font-black text-white">
                  Custom <span className="text-xs font-normal text-slate-400">capacity</span>
                </div>
                <ul className="space-y-2.5 text-xs text-slate-300 pt-2 border-t border-slate-800">
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span><strong>Unlimited</strong> Factory locations</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Unlimited user seats &amp; roles</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>All modules included (Finance + Telemetry)</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Dedicated database isolation &amp; SLA</span>
                  </li>
                </ul>
              </div>

              <button
                type="button"
                onClick={() => onStartOnboarding()}
                className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Contact for Enterprise
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-8 bg-slate-950 border-t border-slate-800 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} FactoryFlow Multi-Tenant SaaS. All rights reserved.</p>
          <div className="flex items-center space-x-6">
            <button type="button" onClick={onGoToLogin} className="hover:text-slate-300 cursor-pointer">
              Workspace Login
            </button>
            <span className="text-slate-700">|</span>
            <span>Version 2.0-Configurable</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

