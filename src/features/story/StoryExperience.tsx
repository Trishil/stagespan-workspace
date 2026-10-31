import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  ArrowRight,
  Maximize2,
  Volume2,
  VolumeX,
  Play,
  Pause,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Building2,
  Layers,
  Truck,
  Package,
  Scan,
  Scissors,
  ArrowUpRight,
  Compass,
  X,
  RotateCw
} from 'lucide-react';

interface StoryExperienceProps {
  onGoToWorkspace: () => void;
  onGoToOnboarding: () => void;
  onGoToLogin: () => void;
  isPlatformAdmin?: boolean;
}

interface Chapter {
  id: string;
  number: string;
  tagline: string;
  title: string;
  subtitle: string;
  description: string;
  videoSrc?: string;
  fallbackImage: string;
  altVideoSrc?: string;
  specs: { label: string; value: string }[];
  phase: string;
  erpStageReference: string;
}

const CHAPTERS: Chapter[] = [
  {
    id: 'act-1-arrival',
    number: '01',
    tagline: 'Mill Intake Bay',
    title: 'Arrival of the Raw Ground Cloth',
    subtitle: 'Unbleached natural cotton and pure ivory mulberry silk arrive at the factory dock.',
    description:
      'The journey starts at the raw material intake dock. Giant bolts of unbleached long-staple cotton and natural ivory mulberry silk are unloaded directly from spinning mills onto hardwood pallets. Each roll is barcoded, conditioned, and weighed to verify moisture content and yarn density before entering production.',
    videoSrc: './assets/story/raw-fabric-arrival.mp4',
    fallbackImage: './assets/story/raw-fabric-warehouse.png',
    specs: [
      { label: 'Fiber Composition', value: '100% Unbleached Mulberry Silk & Egyptian Cotton' },
      { label: 'Intake Bay', value: 'Warehouse Dock #02 · Surat Hub' },
      { label: 'Tensile Rating', value: 'Grade A+ Certified · 480 GSM' },
      { label: 'ERP Tracking', value: 'Stage 01 · Mill Intake Ledger' }
    ],
    phase: 'Physical Inflow',
    erpStageReference: '1. RAW INTAKE'
  },
  {
    id: 'act-2-stitching',
    number: '02',
    tagline: 'Loom & Needle Calibration',
    title: 'The Multi-Needle Calibration',
    subtitle: 'Pneumatic tension frames stretch the sapphire cloth as high-speed needles align.',
    description:
      'The raw cloth is mounted onto multi-head industrial embroidery frames. Pneumatic tensioners lock the fabric drum-tight to avoid microscopic pucker. Chrome needles, guided by dual laser alignment, calibrate their stroke depth at 1,200 stitches per minute to prep the field for high-density stitching.',
    videoSrc: './assets/story/stitching-machine-precision.mp4',
    fallbackImage: './assets/story/machine-embroidery-action.png',
    specs: [
      { label: 'Needle Velocity', value: '1,200 Stitches / Min per head' },
      { label: 'Frame Tension', value: '18.5 cN Balanced Tension' },
      { label: 'Needle Gauge', value: '15-Needle Industrial Tajima Array' },
      { label: 'ERP Tracking', value: 'Stage 03 · Loom & Frame Setup' }
    ],
    phase: 'Mechanical Precision',
    erpStageReference: '3. MACHINE STITCHING'
  },
  {
    id: 'act-3-zari',
    number: '03',
    tagline: 'Digitized Vector to Needle',
    title: 'The Golden Zari Bloom',
    subtitle: 'Mathematical embroidery CAD loads into memory as pure metallic thread blooms in relief.',
    description:
      'The CAD vector design is uploaded directly into machine memory. Pure metallic gold zari thread feeds into the multi-head needle bank. Layer by layer, over 84,000 microscopic stitches weave raised floral motifs with sculptural relief, catching sunlight and casting soft golden embers.',
    videoSrc: './assets/story/gold-zari-single-needle.mp4',
    altVideoSrc: './assets/story/gold-zari-embroidery-array.mp4',
    fallbackImage: './assets/story/golden-embroidery-navy.png',
    specs: [
      { label: 'Vector Schematic', value: 'CAD_ROYAL_FLORAL_ZARI_V3' },
      { label: 'Thread Spec', value: '120D High-Sheen Metallic Gold Zari' },
      { label: 'Total Stitch Density', value: '84,200 Micro-Stitches' },
      { label: 'ERP Tracking', value: 'Stage 05 · Design Execution' }
    ],
    phase: 'Artisanal Craft',
    erpStageReference: '5. ZARI & EMBROIDERY'
  },
  {
    id: 'act-4-box',
    number: '04',
    tagline: 'Archival Presentation Casket',
    title: 'Cased in Matte Obsidian Luxury',
    subtitle: 'Hand-inspected, folded along grain lines, and encased in gold-foil presentation boxes.',
    description:
      'Once off the frame, the embroidered fabric passes a 14-point tactile inspection under high-CRI halogen lights. Missed stitches are repaired, threads trimmed, and the garment is folded with acid-free tissue paper before being placed into a heavy matte-black presentation casket hot-stamped with the 24K gold Trisharth emblem.',
    fallbackImage: './assets/story/luxury-packaging-handoff.png',
    specs: [
      { label: 'Casket Construction', value: 'Rigid 1200 GSM Matte Obsidian' },
      { label: 'Embossing', value: '24K Metallic Hot-Stamping' },
      { label: 'Lining', value: 'Archival Neutral pH Parchment Tissue' },
      { label: 'ERP Tracking', value: 'Stage 09 · Final Casing & Packing' }
    ],
    phase: 'Artisanal Packaging',
    erpStageReference: '9. FOLDING & BOXING'
  },
  {
    id: 'act-5-customer',
    number: '05',
    tagline: 'Showroom Handover',
    title: 'Into the Hands of the Creator',
    subtitle: 'From mill arrival to boutique delivery in 48 hours. Every thread accounted for.',
    description:
      'The sealed luxury casket arrives at the client boutique showroom in the late afternoon golden hour. The courier completes physical handover; the client inspects the bespoke gold zari embroidery with admiration. The dispatch record is logged instantaneously on the Factory ERP.',
    fallbackImage: './assets/story/luxury-packaging-handoff.png',
    specs: [
      { label: 'Turnaround Time', value: '48 Hours Mill-to-Showroom' },
      { label: 'Delivery Proof', value: 'Instantaneous Digital Challan' },
      { label: 'Client Experience', value: 'Bespoke Luxury Reception' },
      { label: 'ERP Tracking', value: 'Stage 10 · Prepare for Dispatch' }
    ],
    phase: 'Final Delivery',
    erpStageReference: '10. DISPATCH HANDOVER'
  }
];

export const StoryExperience: React.FC<StoryExperienceProps> = ({
  onGoToWorkspace,
  onGoToOnboarding,
  onGoToLogin,
  isPlatformAdmin
}) => {
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [activeChapterIndex, setActiveChapterIndex] = useState<number>(0);
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(true);
  const [activeAltVideo, setActiveAltVideo] = useState<boolean>(false);
  const [selectedLightboxImage, setSelectedLightboxImage] = useState<string | null>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState<boolean>(true);

  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({});

  // Track scroll position across the 500vh container
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const totalScrollableDistance = containerRef.current.offsetHeight - window.innerHeight;
      if (totalScrollableDistance <= 0) return;

      const progress = Math.min(
        1,
        Math.max(0, -rect.top / totalScrollableDistance)
      );
      setScrollProgress(progress);

      // Determine active chapter (5 chapters total, 0.20 each)
      const chapterIdx = Math.min(
        CHAPTERS.length - 1,
        Math.floor(progress * CHAPTERS.length)
      );
      setActiveChapterIndex(chapterIdx);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Jump smoothly to a specific chapter
  const scrollToChapter = (index: number) => {
    if (!containerRef.current) return;
    const totalScrollableDistance = containerRef.current.offsetHeight - window.innerHeight;
    const targetScrollY =
      containerRef.current.offsetTop + (index / CHAPTERS.length) * totalScrollableDistance;
    window.scrollTo({ top: targetScrollY, behavior: 'smooth' });
  };

  const activeChapter = CHAPTERS[activeChapterIndex];

  // Calculate local progress inside the active chapter (0 to 1)
  const localChapterProgress = Math.min(
    1,
    Math.max(
      0,
      (scrollProgress - activeChapterIndex / CHAPTERS.length) * CHAPTERS.length
    )
  );

  return (
    <div className="relative bg-[#08090C] text-[#E8E6E1] min-h-screen selection:bg-amber-400 selection:text-black font-sans">
      {/* ──────────────────────────────────────────────────────────── */}
      {/* 1. TOP EDITORIAL BAR (Permanent Navigation & Interconnection) */}
      {/* ──────────────────────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#08090C]/80 backdrop-blur-xl border-b border-white/[0.08] px-4 md:px-8 py-3.5 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Atelier Brand Identity */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 flex items-center justify-center text-black font-bold shadow-lg shadow-amber-500/20">
              <span className="font-editorial text-lg tracking-wider">T</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm tracking-wider uppercase text-white">
                  Textflow
                </span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-white/[0.08] text-amber-300 border border-amber-300/20">
                  3D Story
                </span>
              </div>
              <p className="text-[11px] text-white/50 hidden sm:block">
                The Living Thread · Trisharth Manufacturing Atelier
              </p>
            </div>
          </div>

          {/* Chapter Timeline Indicator (Desktop) */}
          <div className="hidden lg:flex items-center gap-1.5 bg-white/[0.04] p-1 rounded-full border border-white/[0.08]">
            {CHAPTERS.map((ch, idx) => {
              const isActive = activeChapterIndex === idx;
              return (
                <button
                  key={ch.id}
                  onClick={() => scrollToChapter(idx)}
                  className={`px-3 py-1 text-xs rounded-full transition-all flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-amber-400 text-black font-semibold shadow-md shadow-amber-500/20'
                      : 'text-white/60 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <span className="font-mono text-[10px] opacity-75">{ch.number}</span>
                  <span className="hidden xl:inline">{ch.tagline}</span>
                </button>
              );
            })}
          </div>

          {/* Interconnection Bridges (Live Factory ERP & Controls) */}
          <div className="flex items-center gap-2.5">
            {/* Audio Toggle */}
            <button
              onClick={() => setIsAudioMuted(!isAudioMuted)}
              title={isAudioMuted ? 'Unmute video audio' : 'Mute video audio'}
              className="p-2 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-white/80 hover:text-white transition-colors border border-white/[0.08]"
            >
              {isAudioMuted ? (
                <VolumeX className="w-4 h-4 text-white/60" />
              ) : (
                <Volume2 className="w-4 h-4 text-amber-400 animate-pulse" />
              )}
            </button>

            {/* Launch Factory ERP (Primary Interconnection Bridge) */}
            <button
              onClick={onGoToWorkspace}
              className="group relative inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-semibold text-xs transition-all shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-black opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-black"></span>
              </span>
              <span>Launch Factory ERP</span>
              <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </header>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* 2. THE 500VH SCROLL TRACK & STICKY 100VH 3D SCROLLYTELLING   */}
      {/* ──────────────────────────────────────────────────────────── */}
      <div ref={containerRef} className="relative h-[500vh]">
        {/* Sticky 100vh Viewport Stage */}
        <div className="sticky top-0 h-screen w-full overflow-hidden flex flex-col justify-between pt-16 pb-8">
          {/* Background Visual Layer for All 5 Chapters */}
          <div className="absolute inset-0 z-0">
            {CHAPTERS.map((chapter, idx) => {
              const isCurrent = activeChapterIndex === idx;
              const hasVideo = Boolean(chapter.videoSrc);
              const currentVideoSrc =
                idx === 2 && activeAltVideo && chapter.altVideoSrc
                  ? chapter.altVideoSrc
                  : chapter.videoSrc;

              return (
                <div
                  key={chapter.id}
                  className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                    isCurrent ? 'opacity-100 scale-100' : 'opacity-0 scale-105 pointer-events-none'
                  }`}
                >
                  {/* Video Presentation */}
                  {hasVideo && currentVideoSrc ? (
                    <video
                      ref={(el) => {
                        videoRefs.current[chapter.id] = el;
                      }}
                      src={currentVideoSrc}
                      poster={chapter.fallbackImage}
                      autoPlay
                      muted={isAudioMuted}
                      loop
                      playsInline
                      className="w-full h-full object-cover filter brightness-[0.75] contrast-[1.12]"
                    />
                  ) : (
                    /* High-Res Cinematic Image Presentation */
                    <img
                      src={chapter.fallbackImage}
                      alt={chapter.title}
                      className="w-full h-full object-cover filter brightness-[0.75] contrast-[1.12] transition-transform duration-1000"
                    />
                  )}

                  {/* Editorial Film Grain & Vignette Gradients */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#08090C] via-[#08090C]/35 to-[#08090C]/75" />
                  <div className="absolute inset-0 bg-radial-gradient from-transparent via-transparent to-[#08090C]/80" />
                </div>
              );
            })}
          </div>

          {/* Interactive Floating Micro-HUD (Chapter Status & Alt Video Switch) */}
          <div className="relative z-20 max-w-7xl mx-auto w-full px-4 md:px-8 pt-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs uppercase px-2.5 py-1 rounded-full bg-white/[0.08] backdrop-blur-md border border-white/[0.12] text-amber-300">
                Phase: {activeChapter.phase}
              </span>
              <span className="hidden sm:inline font-mono text-xs text-white/50">
                ERP Stage Map: <strong className="text-white/80">{activeChapter.erpStageReference}</strong>
              </span>
            </div>

            {/* Act 3 Specific Toggle: Switch between Single Needle Macro & 20s Multi-Head Array */}
            {activeChapterIndex === 2 && (
              <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-amber-400/30">
                <span className="text-[11px] text-amber-300/80 font-mono">Camera Angle:</span>
                <button
                  onClick={() => setActiveAltVideo(false)}
                  className={`text-xs px-2.5 py-0.5 rounded-full transition-all ${
                    !activeAltVideo
                      ? 'bg-amber-400 text-black font-semibold'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  Macro Needle
                </button>
                <button
                  onClick={() => setActiveAltVideo(true)}
                  className={`text-xs px-2.5 py-0.5 rounded-full transition-all ${
                    activeAltVideo
                      ? 'bg-amber-400 text-black font-semibold'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  Multi-Head Array (20s)
                </button>
              </div>
            )}

            {/* Inspect 4K High-Res Full Image Modal Button */}
            <button
              onClick={() => setSelectedLightboxImage(activeChapter.fallbackImage)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.08] hover:bg-white/[0.16] backdrop-blur-md text-xs text-white/90 border border-white/[0.12] transition-colors"
            >
              <Maximize2 className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden sm:inline">Inspect 4K Detail</span>
            </button>
          </div>

          {/* ──────────────────────────────────────────────────────────── */}
          {/* Main Narrative Focus Area (Editorial Card + Live 3D Stats)   */}
          {/* ──────────────────────────────────────────────────────────── */}
          <div className="relative z-20 max-w-7xl mx-auto w-full px-4 md:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-end my-auto">
            {/* Left 7 Columns: The Editorial Narrative */}
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2">
                <span className="font-mono text-xs text-amber-400 font-semibold tracking-widest uppercase">
                  Act {activeChapter.number} of 05
                </span>
                <span className="w-8 h-[1px] bg-amber-400/40" />
                <span className="text-xs text-white/60 tracking-wider uppercase font-mono">
                  {activeChapter.tagline}
                </span>
              </div>

              <h1 className="font-editorial text-4xl sm:text-5xl lg:text-6xl text-white font-normal leading-[1.08] tracking-tight">
                {activeChapter.title}
              </h1>

              <p className="text-base sm:text-lg text-amber-100/90 font-light leading-relaxed max-w-2xl">
                {activeChapter.subtitle}
              </p>

              <p className="text-xs sm:text-sm text-white/70 leading-relaxed max-w-2xl font-normal">
                {activeChapter.description}
              </p>

              {/* Special Interactive 3D Presentation Casket on Chapter 04 */}
              {activeChapterIndex === 3 && (
                <div className="pt-2">
                  <div className="p-4 rounded-xl bg-black/60 backdrop-blur-md border border-amber-400/20 max-w-md">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono uppercase tracking-wider text-amber-300">
                        Interactive Archival Box Spec
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                        Sealed & Inspected
                      </span>
                    </div>
                    <div className="aspect-[16/9] w-full rounded-lg overflow-hidden relative group border border-white/10">
                      <img
                        src="./assets/story/luxury-packaging-handoff.png"
                        alt="Luxury Presentation Box"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-3">
                        <span className="text-xs text-amber-200 font-serif italic">
                          "Trisharth Textile" 24K Hot-Stamped Obsidian Presentation Casket
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Chapter 5 Specific: Direct CTA to Enter Live Factory ERP */}
              {activeChapterIndex === 4 && (
                <div className="pt-4 flex flex-wrap items-center gap-3">
                  <button
                    onClick={onGoToWorkspace}
                    className="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 text-black font-bold text-sm shadow-xl shadow-amber-500/25 hover:shadow-amber-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    <Building2 className="w-4 h-4" />
                    <span>Enter Live Factory ERP Workspace</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    onClick={onGoToOnboarding}
                    className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-white text-xs font-semibold border border-white/[0.12] transition-colors"
                  >
                    <span>Configure Custom Factory</span>
                  </button>
                </div>
              )}
            </div>

            {/* Right 5 Columns: The Tactical Production Ledger Specs */}
            <div className="lg:col-span-5 space-y-3">
              <div className="bg-[#0B0D13]/85 backdrop-blur-xl rounded-2xl border border-white/[0.1] p-5 shadow-2xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                  <div className="flex items-center gap-2">
                    <Scan className="w-4 h-4 text-amber-400" />
                    <span className="font-mono text-xs uppercase tracking-wider text-white/90">
                      Telemetry & Verification
                    </span>
                  </div>
                  <span className="font-mono text-xs text-amber-400 font-semibold">
                    {Math.round(localChapterProgress * 100)}% Synced
                  </span>
                </div>

                {/* Tactical Key-Values */}
                <div className="space-y-2.5">
                  {activeChapter.specs.map((spec, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-xs py-1.5 px-2 rounded-lg bg-white/[0.02] border border-white/[0.04]"
                    >
                      <span className="text-white/50">{spec.label}</span>
                      <span className="font-mono font-medium text-white/95 text-right">
                        {spec.value}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Dynamic Metric Bar */}
                <div className="pt-2">
                  <div className="flex items-center justify-between text-[11px] font-mono text-white/60 mb-1">
                    <span>Manufacturing Integrity</span>
                    <span className="text-emerald-400 font-semibold">100% Invariant Passed</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/[0.08] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-400 via-amber-300 to-emerald-400 rounded-full transition-all duration-300"
                      style={{ width: `${Math.round(localChapterProgress * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Link directly to ERP stage */}
                <button
                  onClick={onGoToWorkspace}
                  className="w-full mt-2 py-2 px-3 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-[11px] text-white/80 hover:text-white flex items-center justify-between transition-colors font-mono"
                >
                  <span>Open {activeChapter.erpStageReference} in Kanban</span>
                  <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
                </button>
              </div>
            </div>
          </div>

          {/* ──────────────────────────────────────────────────────────── */}
          {/* Bottom Floating Scrubber & Scroll Progress HUD              */}
          {/* ──────────────────────────────────────────────────────────── */}
          <div className="relative z-20 max-w-7xl mx-auto w-full px-4 md:px-8">
            <div className="bg-[#08090C]/80 backdrop-blur-xl rounded-2xl border border-white/[0.1] px-5 py-3 flex flex-col md:flex-row items-center justify-between gap-4">
              {/* Left: Overall Journey Progress */}
              <div className="flex items-center gap-3 w-full md:w-auto">
                <span className="font-mono text-xs text-amber-400 font-semibold">
                  {Math.round(scrollProgress * 100)}%
                </span>
                <div className="h-2 w-32 md:w-48 bg-white/[0.08] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 via-amber-300 to-teal-400 transition-all duration-150"
                    style={{ width: `${Math.round(scrollProgress * 100)}%` }}
                  />
                </div>
                <span className="text-xs text-white/50 hidden sm:inline">
                  Scroll or scrub through lifecycle
                </span>
              </div>

              {/* Center: Direct Act Jump Buttons */}
              <div className="flex items-center gap-1.5">
                {CHAPTERS.map((ch, idx) => (
                  <button
                    key={ch.id}
                    onClick={() => scrollToChapter(idx)}
                    className={`w-7 h-7 rounded-lg text-xs font-mono font-semibold transition-all flex items-center justify-center ${
                      activeChapterIndex === idx
                        ? 'bg-amber-400 text-black shadow-md shadow-amber-500/20'
                        : 'bg-white/[0.04] text-white/60 hover:text-white hover:bg-white/[0.08] border border-white/[0.06]'
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>

              {/* Right: Quick Jump to Factory ERP */}
              <button
                onClick={onGoToWorkspace}
                className="text-xs text-white/70 hover:text-white flex items-center gap-1.5 transition-colors font-mono"
              >
                <span>Full Factory ERP</span>
                <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* 3. LIGHTBOX MODAL FOR 4K HIGH-RESOLUTION INSPECTION          */}
      {/* ──────────────────────────────────────────────────────────── */}
      {selectedLightboxImage && (
        <div
          onClick={() => setSelectedLightboxImage(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-2xl flex items-center justify-center p-4 cursor-zoom-out"
        >
          <div
            className="relative max-w-6xl w-full max-h-[90vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedLightboxImage(null)}
              className="absolute -top-12 right-0 p-2 rounded-full bg-white/[0.1] hover:bg-white/[0.2] text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={selectedLightboxImage}
              alt="4K Detailed Inspection"
              className="w-full h-auto max-h-[80vh] object-contain rounded-xl border border-white/[0.15] shadow-2xl"
            />
            <div className="mt-3 text-center">
              <p className="text-xs font-mono text-white/70">
                1672 × 941 Ultra-High Resolution Inspection
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
