import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  Sparkles, 
  Sliders, 
  Maximize2, 
  Camera, 
  Film, 
  Eye, 
  Layers, 
  Zap, 
  RotateCcw,
  CheckCircle2,
  Wand2,
  ArrowRight
} from 'lucide-react';

export type CinemaShotId = 'embroidery' | 'dyeing' | 'laser_qc' | 'robotic_floor';

interface CinemaShot {
  id: CinemaShotId;
  title: string;
  tagline: string;
  duration: string;
  lens: string;
  prompt: string;
  accentColor: string;
  telemetry: { label: string; value: string }[];
}

const CINEMA_SHOTS: CinemaShot[] = [
  {
    id: 'embroidery',
    title: 'Macro Needles & Zari Loom',
    tagline: '1,200 SPM Multi-Head Synchrony',
    duration: '00:12:45',
    lens: '85mm T1.5 Anamorphic',
    prompt: 'Macro cinematic push-in on 15 high-speed embroidery needles stitching metallic gold zari thread into royal sapphire fabric, atmospheric golden rim light, shallow depth of field, 8K 60fps',
    accentColor: '#f59e0b',
    telemetry: [
      { label: 'Needle Speed', value: '1,200 SPM' },
      { label: 'Tension Balance', value: '99.4%' },
      { label: 'Thread Integrity', value: '100% OK' }
    ]
  },
  {
    id: 'dyeing',
    title: 'Vortex Dyeing Cascade',
    tagline: 'Fluid Pigment Hydro-Dynamics',
    duration: '00:08:19',
    lens: '50mm f/1.2 Cine Prime',
    prompt: 'Hyper-realistic macro fluid simulation inside industrial pressurized textile dyeing chamber, swirling turquoise and magenta liquid pigments diffusing across raw silk, 4K slow motion 120fps',
    accentColor: '#06b6d4',
    telemetry: [
      { label: 'Vat Temp', value: '88.5°C' },
      { label: 'Vortex RPM', value: '450 RPM' },
      { label: 'Color Saturation', value: 'Delta E < 0.4' }
    ]
  },
  {
    id: 'laser_qc',
    title: 'Volumetric Laser QC Scan',
    tagline: 'Sub-Millimeter Defect Neural AI',
    duration: '00:15:02',
    lens: '35mm T2.0 Technovision',
    prompt: 'High-speed automated inspection conveyor with electric blue volumetric laser scanning running fabric surface, dynamic neural bounding boxes highlighting weave accuracy in real time, cinematic dark studio',
    accentColor: '#8b5cf6',
    telemetry: [
      { label: 'Scan Width', value: '2.4 Meters' },
      { label: 'Defect Detection', value: '0.001mm' },
      { label: 'Pass Rate', value: '99.88%' }
    ]
  },
  {
    id: 'robotic_floor',
    title: 'Automated Floor Symphony',
    tagline: 'Drone FPV Factory Flythrough',
    duration: '00:22:11',
    lens: '24mm Ultra-Wide Cine',
    prompt: 'Continuous cinematic drone fpv flythrough across sprawling automated textile manufacturing floor, robotic sorting arms placing folded garments with glowing RFID tags, moody volumetric ambient fog',
    accentColor: '#10b981',
    telemetry: [
      { label: 'Active Bays', value: '18 Stations' },
      { label: 'Throughput', value: '450 Pcs/Hr' },
      { label: 'Network Latency', value: '4.2 ms' }
    ]
  }
];

export const HiggsfieldCinemaStudio: React.FC = () => {
  const [activeShotId, setActiveShotId] = useState<CinemaShotId>('embroidery');
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isSlowMo, setIsSlowMo] = useState<boolean>(false);
  const [timelineProgress, setTimelineProgress] = useState<number>(35);
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [isRenderingEffect, setIsRenderingEffect] = useState<boolean>(false);
  const [generatedCount, setGeneratedCount] = useState<number>(24);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activeShot = CINEMA_SHOTS.find(s => s.id === activeShotId) || CINEMA_SHOTS[0];

  // 60FPS Canvas Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let tick = 0;

    // Set high-DPI resolution
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    // Particle pool for fluid & sparks
    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      alpha: number;
      color: string;
      life: number;
      maxLife: number;
    }

    const particles: Particle[] = [];
    const maxParticles = 90;

    const render = () => {
      const width = rect.width;
      const height = rect.height;

      // Dark background with faint fade for motion blur
      ctx.fillStyle = 'rgba(5, 8, 20, 0.28)';
      ctx.fillRect(0, 0, width, height);

      const speedFactor = isSlowMo ? 0.35 : 1.0;
      if (isPlaying) {
        tick += speedFactor;
        setTimelineProgress(prev => (prev + (0.08 * speedFactor)) % 100);
      }

      // Draw subtle cinematic scanline overlay
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.015)';
      ctx.lineWidth = 1;
      for (let y = 0; y < height; y += 4) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // SCENE 1: EMBROIDERY (Rotating loom matrix + needles + golden zari sparks)
      if (activeShot.id === 'embroidery') {
        const numNeedles = 12;
        const spacing = width / (numNeedles + 1);

        // Fabric base weave simulation
        ctx.strokeStyle = 'rgba(30, 58, 138, 0.35)';
        ctx.lineWidth = 1.5;
        for (let i = 0; i < width; i += 18) {
          ctx.beginPath();
          ctx.moveTo(i, 0);
          ctx.lineTo(i, height);
          ctx.stroke();
        }

        // Animated Gold Thread Beams
        ctx.strokeStyle = '#fbbf24';
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 12;
        ctx.lineWidth = 2.5;

        for (let n = 1; n <= numNeedles; n++) {
          const nx = n * spacing;
          const needlePhase = Math.sin(tick * 0.08 + n * 0.7);
          const needleY = height * 0.45 + needlePhase * 35;

          // Needle Bar
          ctx.strokeStyle = 'rgba(226, 232, 240, 0.85)';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(nx, 0);
          ctx.lineTo(nx, needleY);
          ctx.stroke();

          // Needle Tip (Glowing point)
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(nx, needleY, 2.5, 0, Math.PI * 2);
          ctx.fill();

          // Golden Thread extending downward
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(nx, needleY);
          const controlY = needleY + (height - needleY) * 0.5 + Math.sin(tick * 0.05 + n) * 15;
          ctx.quadraticCurveTo(nx + Math.sin(tick * 0.1 + n) * 20, controlY, nx + Math.sin(n) * 40, height);
          ctx.stroke();

          // Emit sparks at penetration point
          if (Math.abs(needlePhase) > 0.85 && particles.length < maxParticles) {
            particles.push({
              x: nx,
              y: needleY,
              vx: (Math.random() - 0.5) * 4,
              vy: -Math.random() * 3 - 1,
              size: Math.random() * 2 + 1,
              alpha: 1,
              color: '#fbbf24',
              life: 0,
              maxLife: 30
            });
          }
        }
      }

      // SCENE 2: FLUID DYEING (Vortex fluid currents & pigment mixing)
      else if (activeShot.id === 'dyeing') {
        const cx = width * 0.5;
        const cy = height * 0.5;
        const numRings = 7;

        for (let r = 1; r <= numRings; r++) {
          const radius = r * 35 + Math.sin(tick * 0.03 + r) * 12;
          const rotation = tick * 0.02 * (r % 2 === 0 ? 1 : -1);

          ctx.save();
          ctx.translate(cx, cy);
          ctx.rotate(rotation);

          const grad = ctx.createRadialGradient(0, 0, radius * 0.3, 0, 0, radius);
          grad.addColorStop(0, r % 2 === 0 ? 'rgba(6, 182, 212, 0.4)' : 'rgba(236, 72, 153, 0.35)');
          grad.addColorStop(1, 'rgba(5, 8, 20, 0)');

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.ellipse(0, 0, radius, radius * 0.75, rotation, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        // Fluid dye filaments
        for (let i = 0; i < 6; i++) {
          const angle = (i / 6) * Math.PI * 2 + tick * 0.02;
          const fx = cx + Math.cos(angle) * (height * 0.3);
          const fy = cy + Math.sin(angle) * (height * 0.3);

          if (particles.length < maxParticles) {
            particles.push({
              x: fx,
              y: fy,
              vx: -Math.sin(angle) * 2.5,
              vy: Math.cos(angle) * 2.5,
              size: Math.random() * 4 + 2,
              alpha: 0.9,
              color: i % 2 === 0 ? '#06b6d4' : '#ec4899',
              life: 0,
              maxLife: 60
            });
          }
        }
      }

      // SCENE 3: LASER QC (Scanning blue volumetric beam + AI bounding boxes)
      else if (activeShot.id === 'laser_qc') {
        // Fabric Weave Grid
        ctx.strokeStyle = 'rgba(71, 85, 105, 0.25)';
        ctx.lineWidth = 1;
        const step = 28;
        for (let x = 0; x < width; x += step) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }
        for (let y = 0; y < height; y += step) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }

        // Moving Volumetric Laser Line
        const laserX = (Math.sin(tick * 0.04) * 0.45 + 0.5) * width;

        // Laser Beam Glow
        const laserGrad = ctx.createLinearGradient(laserX - 30, 0, laserX + 30, 0);
        laserGrad.addColorStop(0, 'rgba(139, 92, 246, 0)');
        laserGrad.addColorStop(0.5, 'rgba(139, 92, 246, 0.6)');
        laserGrad.addColorStop(1, 'rgba(139, 92, 246, 0)');
        ctx.fillStyle = laserGrad;
        ctx.fillRect(laserX - 30, 0, 60, height);

        // Core Sharp Laser
        ctx.strokeStyle = '#c084fc';
        ctx.shadowColor = '#a855f7';
        ctx.shadowBlur = 15;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(laserX, 0);
        ctx.lineTo(laserX, height);
        ctx.stroke();

        // AI Bounding Boxes detected on fabric
        const boxes = [
          { x: width * 0.25, y: height * 0.35, w: 90, h: 70, label: 'PATTERN: 99.9%', pass: true },
          { x: width * 0.58, y: height * 0.48, w: 110, h: 80, label: 'WARP WEAVE: 100%', pass: true },
          { x: width * 0.78, y: height * 0.25, w: 75, h: 60, label: 'COLOR: ΔE 0.12', pass: true }
        ];

        boxes.forEach((box) => {
          ctx.strokeStyle = 'rgba(52, 211, 153, 0.7)';
          ctx.shadowColor = '#10b981';
          ctx.shadowBlur = 8;
          ctx.lineWidth = 1.5;
          ctx.strokeRect(box.x, box.y, box.w, box.h);

          // Box Corner Accents
          const cl = 8;
          ctx.strokeStyle = '#34d399';
          ctx.lineWidth = 2.5;
          // Top-Left
          ctx.beginPath();
          ctx.moveTo(box.x, box.y + cl);
          ctx.lineTo(box.x, box.y);
          ctx.lineTo(box.x + cl, box.y);
          ctx.stroke();
          // Bottom-Right
          ctx.beginPath();
          ctx.moveTo(box.x + box.w - cl, box.y + box.h);
          ctx.lineTo(box.x + box.w, box.y + box.h);
          ctx.lineTo(box.x + box.w, box.y + box.h - cl);
          ctx.stroke();

          // Label
          ctx.fillStyle = '#34d399';
          ctx.font = '10px monospace';
          ctx.fillText(box.label, box.x + 4, box.y - 5);
        });
      }

      // SCENE 4: ROBOTIC FLOOR (Perspective 3D grid with moving automated paths)
      else if (activeShot.id === 'robotic_floor') {
        const horizon = height * 0.35;
        const vanishX = width * 0.5;

        // Ground perspective grid
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.25)';
        ctx.lineWidth = 1;

        for (let i = -10; i <= 10; i++) {
          const bx = vanishX + i * 85;
          ctx.beginPath();
          ctx.moveTo(vanishX, horizon);
          ctx.lineTo(bx, height);
          ctx.stroke();
        }

        for (let y = horizon + 10; y < height; y += (y - horizon) * 0.35 + 8) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }

        // Automated AGV Conveyor Pods moving along perspective lines
        const numPods = 5;
        for (let p = 0; p < numPods; p++) {
          const podProgress = (tick * 0.008 + p * 0.22) % 1;
          const podY = horizon + podProgress * (height - horizon);
          const scale = podProgress * 1.4 + 0.3;
          const laneOffset = ((p % 3) - 1) * (120 * scale);
          const podX = vanishX + laneOffset;

          // Pod Body
          ctx.fillStyle = 'rgba(16, 185, 129, 0.85)';
          ctx.shadowColor = '#10b981';
          ctx.shadowBlur = 10 * scale;
          ctx.fillRect(podX - 18 * scale, podY - 10 * scale, 36 * scale, 20 * scale);

          // Headlight beam
          const beamGrad = ctx.createLinearGradient(podX, podY, podX, podY + 50 * scale);
          beamGrad.addColorStop(0, 'rgba(52, 211, 153, 0.4)');
          beamGrad.addColorStop(1, 'rgba(52, 211, 153, 0)');
          ctx.fillStyle = beamGrad;
          ctx.beginPath();
          ctx.moveTo(podX - 10 * scale, podY + 10 * scale);
          ctx.lineTo(podX - 25 * scale, podY + 50 * scale);
          ctx.lineTo(podX + 25 * scale, podY + 50 * scale);
          ctx.lineTo(podX + 10 * scale, podY + 10 * scale);
          ctx.fill();
        }
      }

      // Render & update active particle pool
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life++;
        p.alpha = 1 - p.life / p.maxLife;

        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 6;
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        if (p.life >= p.maxLife) {
          particles.splice(i, 1);
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [activeShot, isPlaying, isSlowMo]);

  const handleSimulateRender = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPrompt.trim()) return;
    setIsRenderingEffect(true);
    setTimeout(() => {
      setIsRenderingEffect(false);
      setGeneratedCount(prev => prev + 1);
      // Switch shot to showcase new perspective
      const shotIds: CinemaShotId[] = ['embroidery', 'dyeing', 'laser_qc', 'robotic_floor'];
      const nextIdx = (shotIds.indexOf(activeShotId) + 1) % shotIds.length;
      setActiveShotId(shotIds[nextIdx]);
    }, 1200);
  };

  return (
    <div className="relative rounded-3xl border border-white/10 bg-slate-950/80 backdrop-blur-2xl overflow-hidden shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)]">
      {/* Top Anamorphic Header Strip */}
      <div className="px-5 py-3.5 bg-slate-900/90 border-b border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2.5">
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 font-mono text-[11px] font-bold">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
            <span>HIGGSFIELD CINEMATIC ENGINE</span>
          </div>
          <span className="text-slate-400 font-mono text-[11px] hidden sm:inline">
            v2.4 HDR • 60.0 FPS
          </span>
        </div>

        {/* Camera Metadata Badges */}
        <div className="flex items-center space-x-3 font-mono text-[11px] text-slate-400">
          <span className="flex items-center space-x-1">
            <Camera className="w-3.5 h-3.5 text-slate-500" />
            <span>{activeShot.lens}</span>
          </span>
          <span className="hidden md:inline px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
            TC: {activeShot.duration}:{(timelineProgress * 0.3).toFixed(0).padStart(2, '0')}
          </span>
          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
            4K MASTER
          </span>
        </div>
      </div>

      {/* Main Canvas Player Screen */}
      <div className="relative aspect-[21/9] min-h-[340px] sm:min-h-[420px] bg-slate-950 flex items-center justify-center overflow-hidden">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Ambient Radial Spotlight Overlay */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-40 transition-opacity duration-700"
          style={{
            background: `radial-gradient(circle at 50% 50%, ${activeShot.accentColor}25 0%, transparent 70%)`
          }}
        />

        {/* Cinematic Letterbox Mask Accent */}
        <div className="absolute inset-0 border-[6px] sm:border-[10px] border-slate-950/70 pointer-events-none" />

        {/* Rendering Glitch / Warp Simulation Overlay */}
        {isRenderingEffect && (
          <div className="absolute inset-0 bg-indigo-950/80 backdrop-blur-md flex flex-col items-center justify-center space-y-3 z-30 animate-in fade-in">
            <Wand2 className="w-10 h-10 text-indigo-400 animate-spin" />
            <p className="font-mono text-xs font-bold tracking-widest text-indigo-200 uppercase">
              Generating Higgsfield Motion Reel...
            </p>
          </div>
        )}

        {/* Live Shot Telemetry Overlay (Bottom-Left) */}
        <div className="absolute bottom-5 left-6 z-20 pointer-events-none hidden sm:block">
          <div className="p-3 rounded-2xl bg-slate-900/80 backdrop-blur-md border border-white/10 space-y-1.5 shadow-xl">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: activeShot.accentColor }} />
              <span className="text-xs font-black text-white">{activeShot.title}</span>
            </div>
            <div className="grid grid-cols-3 gap-2.5 text-[10px] font-mono text-slate-300 pt-1 border-t border-white/10">
              {activeShot.telemetry.map((t, idx) => (
                <div key={idx}>
                  <span className="text-slate-500 block text-[9px]">{t.label}</span>
                  <span className="font-bold text-white">{t.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Playback Controls Overlay (Center when paused) */}
        {!isPlaying && (
          <button
            type="button"
            onClick={() => setIsPlaying(true)}
            className="absolute z-20 w-16 h-16 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/40 flex items-center justify-center text-white transition-all transform hover:scale-110 shadow-2xl cursor-pointer"
          >
            <Play className="w-7 h-7 fill-white ml-1" />
          </button>
        )}
      </div>

      {/* Scrub Bar & Player Toolbar */}
      <div className="px-5 py-3 bg-slate-900/95 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        {/* Timeline Scrubber */}
        <div className="flex items-center space-x-3 w-full sm:w-1/2">
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition-colors cursor-pointer"
            title={isPlaying ? "Pause Animation" : "Play Animation"}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
          </button>

          <button
            type="button"
            onClick={() => setIsSlowMo(!isSlowMo)}
            className={`px-2.5 py-1.5 rounded-xl font-mono text-[11px] font-bold transition-all cursor-pointer ${
              isSlowMo
                ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
            title="Toggle Higgsfield 0.25x Cinematic Slow-Motion"
          >
            {isSlowMo ? '0.25x SLOW-MO' : '1.0x SPEED'}
          </button>

          {/* Interactive Scrub Track */}
          <div 
            className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden cursor-pointer relative group"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const pct = ((e.clientX - rect.left) / rect.width) * 100;
              setTimelineProgress(Math.max(0, Math.min(100, pct)));
            }}
          >
            <div 
              className="h-full rounded-full transition-all duration-100"
              style={{
                width: `${timelineProgress}%`,
                backgroundColor: activeShot.accentColor
              }}
            />
          </div>
        </div>

        {/* Director Shot Selectors */}
        <div className="flex items-center space-x-1.5 overflow-x-auto w-full sm:w-auto justify-end">
          {CINEMA_SHOTS.map((shot) => {
            const isActive = shot.id === activeShot.id;
            return (
              <button
                key={shot.id}
                type="button"
                onClick={() => {
                  setActiveShotId(shot.id);
                  setIsPlaying(true);
                }}
                className={`px-3 py-1.5 rounded-xl font-mono text-[11px] font-bold transition-all shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-white text-slate-950 shadow-md scale-105'
                    : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {shot.title.split(' ')[0]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Higgsfield Prompt Generator Capsule */}
      <div className="p-5 bg-slate-950/90 border-t border-white/10 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs font-mono font-bold text-slate-400">
            <Film className="w-3.5 h-3.5 text-indigo-400" />
            <span>ACTIVE HIGGSFIELD MOTION PROMPT</span>
          </div>
          <span className="text-[11px] font-mono text-slate-500">
            {generatedCount} AI Motion Generations Seeded
          </span>
        </div>

        {/* Current Active Shot Prompt */}
        <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-white/5 font-mono text-xs text-indigo-200/90 leading-relaxed flex items-start space-x-2.5">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="flex-1 italic">
            "{activeShot.prompt}"
          </p>
        </div>

        {/* Prompt Input & Reel Renderer Bar */}
        <form onSubmit={handleSimulateRender} className="flex flex-col sm:flex-row items-center gap-2 pt-1">
          <div className="relative flex-1 w-full">
            <input
              type="text"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Type custom scene: e.g. Macro golden foil hot stamping at 3,000 bar pressure, cinematic dust motes..."
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>
          <button
            type="submit"
            disabled={isRenderingEffect}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 via-violet-600 to-pink-500 hover:opacity-90 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-1.5 transition-all transform active:scale-95 cursor-pointer shrink-0"
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>Generate Motion Shot</span>
          </button>
        </form>
      </div>
    </div>
  );
};
