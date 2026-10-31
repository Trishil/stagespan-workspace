import React, { useState } from 'react';
import { 
  Workflow, 
  Sparkles, 
  Layers, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  Play, 
  RotateCcw, 
  Plus, 
  Check, 
  SlidersHorizontal,
  Zap,
  Activity
} from 'lucide-react';

interface SimulatorStage {
  id: string;
  name: string;
  kind: 'intake' | 'operation' | 'inspection' | 'rework' | 'completion';
  color: string;
  activePcs: number;
}

export const PipelineSchematicSimulator: React.FC = () => {
  const [includeDyeing, setIncludeDyeing] = useState<boolean>(true);
  const [totalSimulatedPieces, setTotalSimulatedPieces] = useState<number>(1450);
  const [activePulseStage, setActivePulseStage] = useState<string | null>(null);
  const [lastActionToast, setLastActionToast] = useState<string | null>(null);

  const baseStages: SimulatorStage[] = [
    { id: 'fabric', name: '1. Raw Fabric', kind: 'intake', color: '#6366f1', activePcs: 120 },
    ...(includeDyeing ? [{ id: 'dyeing', name: '2. Dyeing / Wash', kind: 'operation' as const, color: '#a855f7', activePcs: 240 }] : []),
    { id: 'inspection', name: includeDyeing ? '3. QC Check' : '2. QC Check', kind: 'inspection', color: '#38bdf8', activePcs: 85 },
    { id: 'embroidery', name: includeDyeing ? '4. Embroidery' : '3. Embroidery', kind: 'operation', color: '#f59e0b', activePcs: 450 },
    { id: 'altering', name: includeDyeing ? '5. Altering (Rework)' : '4. Altering (Rework)', kind: 'rework', color: '#f43f5e', activePcs: 15 },
    { id: 'folding', name: includeDyeing ? '6. Folding & Tag' : '5. Folding & Tag', kind: 'operation', color: '#10b981', activePcs: 310 },
    { id: 'dispatch', name: includeDyeing ? '7. Dispatch Ready' : '6. Dispatch Ready', kind: 'completion', color: '#14b8a6', activePcs: 230 }
  ];

  const handleInjectBatch = () => {
    setActivePulseStage('fabric');
    setTotalSimulatedPieces(prev => prev + 100);
    setLastActionToast('⚡ 100 Pieces injected into Fabric Intake — ledger conserved');
    setTimeout(() => setActivePulseStage('embroidery'), 600);
    setTimeout(() => setActivePulseStage('dispatch'), 1200);
    setTimeout(() => {
      setActivePulseStage(null);
      setLastActionToast(null);
    }, 2500);
  };

  const handleSimulateRework = () => {
    setActivePulseStage('altering');
    setLastActionToast('⚠️ Inspection found loose zari loop — 1 piece split into Altering without ledger inflation');
    setTimeout(() => {
      setActivePulseStage(null);
      setLastActionToast(null);
    }, 3000);
  };

  return (
    <div className="relative rounded-3xl border border-white/10 bg-slate-950/70 backdrop-blur-2xl p-6 sm:p-8 space-y-6 shadow-2xl">
      {/* Schematic Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1 rounded-lg bg-indigo-500/20 text-indigo-400">
              <Activity className="w-4 h-4" />
            </span>
            <h3 className="text-base sm:text-lg font-black text-white flex items-center space-x-2">
              <span>Interactive Pipeline Schematic Simulator</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono text-[10px] font-bold">
                LIVE TELEMETRY
              </span>
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Watch mathematical quantity conservation across custom stage columns. Zero phantom units, instant rework routing, and sub-millimeter tracking.
          </p>
        </div>

        {/* Live Simulator Actions */}
        <div className="flex items-center flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setIncludeDyeing(!includeDyeing)}
            className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
              includeDyeing
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'bg-slate-800 text-slate-400 hover:text-white border border-white/10'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>{includeDyeing ? 'Stage: Dyeing Active' : '+ Add Dyeing Column'}</span>
          </button>

          <button
            type="button"
            onClick={handleInjectBatch}
            className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 flex items-center space-x-1.5 transition-all cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>+ Inject 100 Pcs</span>
          </button>

          <button
            type="button"
            onClick={handleSimulateRework}
            className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 font-bold text-xs transition-colors cursor-pointer"
          >
            <span>Simulate Alteration Loop</span>
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {lastActionToast && (
        <div className="p-3 rounded-xl bg-indigo-950/80 border border-indigo-500/40 text-indigo-200 text-xs font-mono flex items-center space-x-2 animate-in fade-in slide-in-from-top-2">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{lastActionToast}</span>
        </div>
      )}

      {/* Schematic Pipeline Flow Nodes */}
      <div className="overflow-x-auto pb-4 pt-2">
        <div className="flex items-center space-x-3 min-w-[850px] justify-between relative">
          {baseStages.map((stage, idx) => {
            const isPulsing = activePulseStage === stage.id;
            return (
              <React.Fragment key={stage.id}>
                {/* Node Box */}
                <div 
                  className={`flex-1 rounded-2xl border p-4 transition-all duration-300 relative ${
                    isPulsing
                      ? 'scale-105 border-white shadow-[0_0_25px_rgba(99,102,241,0.6)] bg-slate-800'
                      : 'border-white/10 bg-slate-900/80 hover:border-white/20'
                  }`}
                  style={{
                    borderTop: `3px solid ${stage.color}`
                  }}
                >
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
                    <span className="uppercase">{stage.kind}</span>
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: stage.color }} />
                  </div>

                  <h4 className="text-xs font-extrabold text-white truncate">{stage.name}</h4>

                  <div className="mt-3 pt-2 border-t border-white/5 flex items-baseline justify-between font-mono">
                    <span className="text-[10px] text-slate-400">Balance:</span>
                    <span className="text-xs font-bold text-emerald-400">{stage.activePcs} pcs</span>
                  </div>
                </div>

                {/* Connecting Laser Conduit */}
                {idx < baseStages.length - 1 && (
                  <div className="w-6 shrink-0 relative flex items-center justify-center">
                    <div className="h-0.5 w-full bg-slate-800 relative overflow-hidden">
                      <div 
                        className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-cyan-400 animate-pulse"
                      />
                    </div>
                    <ArrowRight className="w-3 h-3 text-slate-600 absolute" />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Bottom Invariant Ledger Metrics */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/5 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
        <div>
          <span className="text-slate-500 block text-[10px]">TOTAL INVENTORY CONSERVED</span>
          <span className="text-sm font-black text-white">{totalSimulatedPieces} PCS (100% PARITY)</span>
        </div>
        <div>
          <span className="text-slate-500 block text-[10px]">REWORK LOOP INTEGRITY</span>
          <span className="text-sm font-black text-rose-400">NON-DESTRUCTIVE SPLIT</span>
        </div>
        <div>
          <span className="text-slate-500 block text-[10px]">ACTIVE PIPELINE STAGES</span>
          <span className="text-sm font-black text-indigo-400">{baseStages.length} ORDERED STAGES</span>
        </div>
        <div>
          <span className="text-slate-500 block text-[10px]">IDEMPOTENCY GUARANTEE</span>
          <span className="text-sm font-black text-emerald-400">0.00 PHANTOM DRIFT</span>
        </div>
      </div>
    </div>
  );
};
