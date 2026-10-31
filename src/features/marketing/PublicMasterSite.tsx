import React, { useState, useEffect, useRef } from 'react';
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
  ExternalLink,
  Film,
  Camera,
  Wand2,
  Activity,
  Flame,
  Check,
  Star,
  SlidersHorizontal
} from 'lucide-react';
import { ALL_FACTORY_TEMPLATES } from '../../templates/registry';
import { FactoryTemplate } from '../../domain/configuration/types';
import { HiggsfieldCinemaStudio } from './HiggsfieldCinemaStudio';
import { PipelineSchematicSimulator } from './PipelineSchematicSimulator';

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
  const [machineCount, setMachineCount] = useState<number>(12);
  const [monthlyPieces, setMonthlyPieces] = useState<number>(35000);
  const progressBarRef = useRef<HTMLDivElement>(null);

  const activeTemplate: FactoryTemplate =
    ALL_FACTORY_TEMPLATES.find((t) => t.id === selectedTemplateTab) || ALL_FACTORY_TEMPLATES[0];

  // Scroll Progress fallback for browsers without CSS scroll-timeline
  useEffect(() => {
    const handleScroll = () => {
      if (!progressBarRef.current) return;
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollable > 0) {
        const scrolled = window.scrollY;
        const progress = scrolled / scrollable;
        progressBarRef.current.style.transform = `scaleX(${progress})`;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ROI Calculations
  const calculatedHoursSaved = Math.round((monthlyPieces / 1000) * 1.8 * (machineCount / 4));
  const estimatedSavings = Math.round(calculatedHoursSaved * 450);

  return (
    <div className="min-h-screen bg-[#040711] text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white relative overflow-x-hidden">
      {/* Scroll Progress Bar (Accessible: aria-hidden="true" per modern-web-guidance) */}
      <div 
        ref={progressBarRef}
        aria-hidden="true"
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 z-50 origin-left transform scale-x-0 shadow-[0_0_12px_rgba(99,102,241,0.8)]"
      />

      {/* Atmospheric Background Ambient Grid & Radial Flares */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Top Radial Flare */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[650px] bg-[radial-gradient(ellipse_at_top,_rgba(99,102,241,0.22)_0%,_rgba(168,85,247,0.12)_45%,_transparent_75%)] blur-2xl" />
        
        {/* Subtle Cyber Grid */}
        <div 
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: `linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)`,
            backgroundSize: '48px 48px'
          }}
        />

        {/* Ambient Cyan Side Glow */}
        <div className="absolute top-1/3 -left-48 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        {/* Ambient Purple Side Glow */}
        <div className="absolute top-2/3 -right-48 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      {/* Top Luxury Navigation Bar */}
      <header className="sticky top-0 z-40 bg-[#040711]/85 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <div 
            className="flex items-center space-x-3 cursor-pointer group" 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/30 text-white font-black text-xl group-hover:scale-105 transition-transform">
              F
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-black text-lg tracking-tight text-white">FactoryFlow</span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono">
                  SaaS 2.0
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium -mt-0.5">Configurable Factory Management</p>
            </div>
          </div>

          <nav className="hidden lg:flex items-center space-x-8 text-xs font-bold uppercase tracking-wider text-slate-300">
            <a href="#cinema" className="hover:text-white transition-colors flex items-center space-x-1.5 text-indigo-400">
              <Film className="w-3.5 h-3.5" />
              <span>Higgsfield Cinema</span>
            </a>
            <a href="#schematic" className="hover:text-white transition-colors">Live Pipeline</a>
            <a href="#templates" className="hover:text-white transition-colors">Industry Blueprints</a>
            <a href="#modules" className="hover:text-white transition-colors">Modules</a>
            <a href="#calculator" className="hover:text-white transition-colors">ROI Calculator</a>
            <a href="#pricing" className="hover:text-white transition-colors">Plans</a>
          </nav>

          <div className="flex items-center space-x-3">
            {isPlatformAdmin && onGoToPlatformAdmin && (
              <button
                type="button"
                onClick={onGoToPlatformAdmin}
                className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold hover:bg-amber-500/30 transition-colors cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Super Admin</span>
              </button>
            )}

            <button
              type="button"
              onClick={onGoToLogin}
              className="px-4 py-2 rounded-xl text-slate-300 hover:text-white text-xs font-semibold hover:bg-white/5 border border-transparent hover:border-white/10 transition-colors cursor-pointer"
            >
              Sign In
            </button>

            <button
              type="button"
              onClick={() => onStartOnboarding()}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 via-violet-600 to-purple-600 hover:opacity-95 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center space-x-1.5 transition-all transform active:scale-95 cursor-pointer"
            >
              <span>Launch Factory</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 lg:pt-28 lg:pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto space-y-6">
            
            {/* Higgsfield Motion Badge */}
            <div className="inline-flex items-center space-x-2.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-indigo-500/10 via-purple-500/20 to-pink-500/10 border border-white/15 text-indigo-300 text-xs font-bold backdrop-blur-md shadow-lg shadow-indigo-500/10">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="tracking-wider uppercase font-mono text-[11px]">
                Powered by Higgsfield AI Cinematic Motion Engine
              </span>
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white leading-[1.08]">
              The Operating System for <br />
              <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-cyan-300 bg-clip-text text-transparent">
                Next-Gen Manufacturing.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-slate-300/90 font-normal leading-relaxed max-w-2xl mx-auto">
              Transform high-volume textile and industrial production floors into a fluid, visual, hyper-automated reality. Custom stage columns (like Dyeing &amp; Alteration), sub-millimeter unit tracking, and zero spreadsheet chaos.
            </p>

            {/* CTA Buttons */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3.5">
              <button
                type="button"
                onClick={() => onStartOnboarding()}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 hover:from-indigo-500 hover:to-violet-500 text-white font-extrabold text-sm shadow-2xl shadow-indigo-600/40 flex items-center justify-center space-x-2 transition-all transform hover:-translate-y-0.5 active:scale-95 cursor-pointer"
              >
                <span>Launch Your Plant in 3 Mins</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById('cinema');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-white/15 text-slate-200 font-bold text-sm flex items-center justify-center space-x-2 transition-all hover:border-white/30 backdrop-blur-md cursor-pointer"
              >
                <Film className="w-4 h-4 text-indigo-400" />
                <span>Watch 4K Cinematic Reel</span>
              </button>
            </div>

            {/* Trust Pill Bar */}
            <div className="pt-8 flex flex-wrap items-center justify-center gap-6 text-xs font-mono text-slate-400">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>100% Decimal Invariant Conservation</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Non-Destructive Rework Loops</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Web + Mobile Real-Time Sync</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* HIGGSFIELD CINEMA REEL SECTION (The Showstopper) */}
      <section id="cinema" className="py-16 relative z-10 border-t border-b border-white/10 bg-slate-950/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center space-x-2 text-xs font-mono font-bold text-indigo-400 uppercase tracking-widest mb-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>VISUAL FACTORY INTELLIGENCE</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                Higgsfield Cinematic Motion Showcase
              </h2>
              <p className="text-sm text-slate-400 mt-1 max-w-xl">
                Experience high-speed textile looms, fluid dyeing vortices, and volumetric laser QC through hyper-realistic 60fps cinematic simulation.
              </p>
            </div>

            <div className="flex items-center space-x-2 text-xs font-mono text-slate-400 bg-slate-900/80 px-3.5 py-2 rounded-xl border border-white/10">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Real-Time Canvas Shader • 0.0ms Drop</span>
            </div>
          </div>

          {/* Embedded Higgsfield Studio */}
          <HiggsfieldCinemaStudio />
        </div>
      </section>

      {/* LIVE PIPELINE SCHEMATIC SIMULATOR */}
      <section id="schematic" className="py-20 relative z-10 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center space-x-2 text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest">
              <Activity className="w-3.5 h-3.5" />
              <span>DYNAMIC PIPELINE GEOMETRY</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Test Any Stage Pipeline In Real Time
            </h2>
            <p className="text-sm text-slate-400">
              Add or remove columns like Dyeing with one click. Watch inventory balance update synchronously without mathematical discrepancies.
            </p>
          </div>

          <PipelineSchematicSimulator />
        </div>
      </section>

      {/* HIGGSFIELD-STYLE BENTO GRID (Core Architecture) */}
      <section id="modules" className="py-20 relative z-10 border-b border-white/10 bg-slate-950/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Engineered For Industrial Reality
            </h2>
            <p className="text-sm text-slate-400">
              Every detail is tuned for speed, accuracy, and absolute reliability under continuous floor operations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Bento Card 1: Dynamic Stages */}
            <div className="p-8 rounded-3xl bg-slate-900/70 border border-white/10 hover:border-indigo-500/50 backdrop-blur-xl transition-all duration-300 space-y-4 shadow-xl group">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
                <Workflow className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-white">Dynamic Stage Pipeline</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Add, reorder, or edit columns like Dyeing, Washing, and Printing at will. Automatically cascades across Kanban boards, Fabric &amp; Color Matrix, and mobile floor trackers.
              </p>
              <div className="pt-2 text-xs font-mono text-indigo-400 flex items-center space-x-1.5">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>N-Stage Scalable Architecture</span>
              </div>
            </div>

            {/* Bento Card 2: Mathematical Invariants */}
            <div className="p-8 rounded-3xl bg-slate-900/70 border border-white/10 hover:border-purple-500/50 backdrop-blur-xl transition-all duration-300 space-y-4 shadow-xl group">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-white">Conservation Invariant Engine</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Batch partial transfers, alteration splits, and scrap discards never create floating-point leaks. Every lot balances exactly across inputs and completions.
              </p>
              <div className="pt-2 text-xs font-mono text-purple-400 flex items-center space-x-1.5">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Zero Phantom Units</span>
              </div>
            </div>

            {/* Bento Card 3: Multi-Tenant Vault */}
            <div className="p-8 rounded-3xl bg-slate-900/70 border border-white/10 hover:border-cyan-500/50 backdrop-blur-xl transition-all duration-300 space-y-4 shadow-xl group">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-white">Isolated Multi-Tenant Security</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Strict database security rules isolate tenant data completely. Only the root platform super admin and assigned factory owner can configure workspaces.
              </p>
              <div className="pt-2 text-xs font-mono text-cyan-400 flex items-center space-x-1.5">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Role-Based Access Control</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STARTER INDUSTRY BLUEPRINTS */}
      <section id="templates" className="py-20 relative z-10 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Pre-Configured Industry Blueprints
            </h2>
            <p className="text-sm text-slate-400">
              Start with tailored industry defaults or build a bespoke workflow from scratch.
            </p>
          </div>

          {/* Blueprint Selector Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            {ALL_FACTORY_TEMPLATES.map((tmpl) => (
              <button
                key={tmpl.id}
                type="button"
                onClick={() => setSelectedTemplateTab(tmpl.id)}
                className={`px-5 py-3 rounded-2xl text-xs font-bold transition-all flex items-center space-x-2.5 cursor-pointer ${
                  selectedTemplateTab === tmpl.id
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-xl shadow-indigo-600/30 scale-105'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-white/10'
                }`}
              >
                <span>{tmpl.name}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/30 font-mono">
                  {tmpl.workflow.stages.length} Stages
                </span>
              </button>
            ))}
          </div>

          {/* Active Blueprint Preview Card */}
          <div className="rounded-3xl border border-white/10 bg-slate-900/80 backdrop-blur-xl p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/10 pb-6">
              <div>
                <span className="text-xs font-mono font-bold uppercase text-indigo-400 tracking-wider">
                  {activeTemplate.industry} Blueprint
                </span>
                <h3 className="text-2xl font-black text-white mt-1">{activeTemplate.name}</h3>
                <p className="text-sm text-slate-400 mt-1 max-w-2xl">{activeTemplate.description}</p>
              </div>

              <button
                type="button"
                onClick={() => onStartOnboarding(activeTemplate.id)}
                className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center space-x-2 shadow-lg shadow-indigo-600/30 cursor-pointer shrink-0 transition-all transform active:scale-95"
              >
                <span>Deploy Blueprint</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Stages Display */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {activeTemplate.workflow.stages.map((stg) => (
                <div
                  key={stg.id}
                  className="p-4 rounded-2xl bg-slate-800/60 border border-white/5 space-y-2 hover:border-white/15 transition-colors"
                >
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span>Step {stg.order}</span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] uppercase font-bold bg-white/10 text-white">
                      {stg.stageKind}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-white truncate">{stg.label}</h4>
                  {stg.reworkStageId && (
                    <span className="text-[10px] font-mono text-rose-400 block">
                      Rework ➔ {stg.reworkStageId}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* INTERACTIVE ROI & CAPACITY CALCULATOR */}
      <section id="calculator" className="py-20 relative z-10 border-b border-white/10 bg-slate-950/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Interactive Capacity &amp; Savings Calculator
            </h2>
            <p className="text-sm text-slate-400">
              Calculate projected supervisor hours saved and valuation accuracy improvements for your factory scale.
            </p>
          </div>

          <div className="max-w-4xl mx-auto rounded-3xl border border-white/10 bg-slate-900/80 backdrop-blur-xl p-8 shadow-2xl grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* Controls */}
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between text-xs font-mono mb-2">
                  <span className="text-slate-400 font-bold uppercase">Operating Machines / Bays:</span>
                  <span className="text-sm font-black text-indigo-400">{machineCount} Machines</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="60"
                  value={machineCount}
                  onChange={(e) => setMachineCount(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-mono mb-2">
                  <span className="text-slate-400 font-bold uppercase">Monthly Piece Production:</span>
                  <span className="text-sm font-black text-cyan-400">{monthlyPieces.toLocaleString()} Pcs / Mo</span>
                </div>
                <input
                  type="range"
                  min="5000"
                  max="150000"
                  step="5000"
                  value={monthlyPieces}
                  onChange={(e) => setMonthlyPieces(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
              </div>
            </div>

            {/* Live Outputs */}
            <div className="p-6 rounded-2xl bg-slate-950/80 border border-white/10 space-y-4 font-mono">
              <div>
                <span className="text-slate-500 text-[10px] block uppercase">Estimated Supervisor Time Saved</span>
                <span className="text-3xl font-black text-emerald-400">{calculatedHoursSaved} Hours / Month</span>
              </div>
              <div className="pt-3 border-t border-white/5">
                <span className="text-slate-500 text-[10px] block uppercase">Est. Floor Discrepancy Prevention</span>
                <span className="text-2xl font-black text-white">₹{estimatedSavings.toLocaleString()} / Month</span>
              </div>
              <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                <span className="text-slate-400">Recommended Tier:</span>
                <span className="px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30">
                  {machineCount > 25 ? 'Enterprise Cluster' : (machineCount > 8 ? 'Growth Tier' : 'Starter Plant')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* LUXURY INFINITE MARQUEE TICKER */}
      <section className="py-10 border-b border-white/10 bg-[#03060f] overflow-hidden">
        <div className="flex space-x-12 animate-marquee whitespace-nowrap text-xs font-mono uppercase tracking-widest text-slate-500">
          <span className="flex items-center space-x-2"><span>★</span><span>Surat High-Tech Embroidery Mills</span></span>
          <span className="flex items-center space-x-2"><span>★</span><span>ISO 9001:2015 Quality Standards</span></span>
          <span className="flex items-center space-x-2"><span>★</span><span>Trisharth Industrial Consortia</span></span>
          <span className="flex items-center space-x-2"><span>★</span><span>GOTS Organic Textile Compliance</span></span>
          <span className="flex items-center space-x-2"><span>★</span><span>Atharva Weaving Technologies</span></span>
          <span className="flex items-center space-x-2"><span>★</span><span>Sub-Millimeter Barcode Telemetry</span></span>
          <span className="flex items-center space-x-2"><span>★</span><span>Surat High-Tech Embroidery Mills</span></span>
          <span className="flex items-center space-x-2"><span>★</span><span>ISO 9001:2015 Quality Standards</span></span>
        </div>
      </section>

      {/* PRICING & PLANS */}
      <section id="pricing" className="py-20 relative z-10 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Transparent Factory Tiers
            </h2>
            <p className="text-sm text-slate-400">
              Pick the right capacity for your operating line. Scale anytime with zero downtime.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Starter */}
            <div className="p-8 rounded-3xl bg-slate-900/70 border border-white/10 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-black text-white">Starter</h3>
                <p className="text-xs text-slate-400">Single workshop or pilot factory</p>
                <div className="text-3xl font-black text-white">
                  ₹2,999 <span className="text-xs font-normal text-slate-400">/ mo</span>
                </div>
                <ul className="space-y-2.5 text-xs text-slate-300 pt-3 border-t border-white/10">
                  <li className="flex items-center space-x-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /><span>1 Factory Site</span></li>
                  <li className="flex items-center space-x-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /><span>Up to 5 Floor Operators</span></li>
                  <li className="flex items-center space-x-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /><span>Kanban &amp; Piece Matrix</span></li>
                </ul>
              </div>
              <button
                type="button"
                onClick={() => onStartOnboarding()}
                className="w-full py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Start 14-Day Trial
              </button>
            </div>

            {/* Growth */}
            <div className="p-8 rounded-3xl bg-slate-900 border-2 border-indigo-500 flex flex-col justify-between space-y-6 relative shadow-2xl shadow-indigo-500/20">
              <div className="absolute -top-3.5 right-6 px-3 py-1 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-[10px] font-black uppercase tracking-wider">
                Most Popular
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-black text-white">Growth</h3>
                <p className="text-xs text-slate-400">Multi-stage commercial textile plants</p>
                <div className="text-3xl font-black text-white">
                  ₹7,999 <span className="text-xs font-normal text-slate-400">/ mo</span>
                </div>
                <ul className="space-y-2.5 text-xs text-slate-300 pt-3 border-t border-white/10">
                  <li className="flex items-center space-x-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /><span>Up to 3 Factory Plants</span></li>
                  <li className="flex items-center space-x-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /><span>Up to 25 Team Members</span></li>
                  <li className="flex items-center space-x-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /><span>Dynamic Stage Masters (Dyeing, etc.)</span></li>
                  <li className="flex items-center space-x-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /><span>Dispatch &amp; Delivery Challans</span></li>
                </ul>
              </div>
              <button
                type="button"
                onClick={() => onStartOnboarding()}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 via-violet-600 to-purple-600 hover:opacity-90 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
              >
                Launch Growth Workspace
              </button>
            </div>

            {/* Enterprise */}
            <div className="p-8 rounded-3xl bg-slate-900/70 border border-white/10 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-black text-white">Enterprise</h3>
                <p className="text-xs text-slate-400">High-volume industrial manufacturing consortia</p>
                <div className="text-3xl font-black text-white">
                  Custom <span className="text-xs font-normal text-slate-400">SLA</span>
                </div>
                <ul className="space-y-2.5 text-xs text-slate-300 pt-3 border-t border-white/10">
                  <li className="flex items-center space-x-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /><span>Unlimited Factories &amp; Seats</span></li>
                  <li className="flex items-center space-x-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /><span>Dedicated Database Isolation</span></li>
                  <li className="flex items-center space-x-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /><span>Custom ERP &amp; SAP Connectors</span></li>
                </ul>
              </div>
              <button
                type="button"
                onClick={() => onStartOnboarding()}
                className="w-full py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Contact Enterprise Team
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CLOSING HIGH-CONVERTING CTA */}
      <section className="py-24 relative overflow-hidden text-center z-10">
        <div className="max-w-4xl mx-auto px-4 space-y-6">
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Ready To Upgrade Your Factory Floor?
          </h2>
          <p className="text-sm text-slate-400 max-w-xl mx-auto">
            Take full control of your manufacturing pipeline today. Deploy your bespoke factory SaaS in under 3 minutes.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => onStartOnboarding()}
              className="px-10 py-4 rounded-2xl bg-gradient-to-r from-indigo-500 via-violet-600 to-cyan-400 hover:opacity-95 text-white font-extrabold text-sm shadow-2xl shadow-indigo-500/40 transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
            >
              Get Started Now — Zero Code Setup
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="mt-auto py-8 bg-[#02040a] border-t border-white/10 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} FactoryFlow Industrial SaaS. Powered by Higgsfield Motion Engine.</p>
          <div className="flex items-center space-x-6">
            <button type="button" onClick={onGoToLogin} className="hover:text-slate-300 cursor-pointer">
              Workspace Login
            </button>
            <span className="text-slate-700">|</span>
            <span className="text-slate-400">v2.4-Aesthetic-Higgsfield</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
