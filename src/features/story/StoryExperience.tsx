import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowRight, ArrowUpRight, Check, Menu, Pause, Play, X } from 'lucide-react';
import './StoryExperience.css';

const asset = (name: string) => `${import.meta.env.BASE_URL}assets/story/optimized/${name}`;
const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));

const CHAPTERS = [
  { id: 'arrival', label: 'The beginning', phase: '01 / INTAKE', title: 'Everything begins\nwith possibility.', description: 'Before the first stitch, there is a material, an idea and a place to begin. Give every incoming roll a place in the process.', video: 'raw-fabric-arrival.mp4', image: 'raw-fabric-warehouse.webp', alt: 'Rolls of raw fabric in a warmly lit textile warehouse', note: 'A place for every material', position: 'center' },
  { id: 'precision', label: 'The precision', phase: '02 / PREPARATION', title: 'A little care.\nIn every detail.', description: 'The frame is set. The needle aligns. The next stage is ready. Keep the handover as considered as the work itself.', video: 'stitching-machine-precision.mp4', image: 'machine-embroidery-action.webp', alt: 'A close view of an embroidery machine working on fabric', note: 'The right work. The right stage.', position: 'center' },
  { id: 'craft', label: 'The making', phase: '03 / EMBROIDERY', title: 'An idea becomes\nsomething tangible.', description: 'Thread by thread, the design takes shape. Follow the work as it moves, with room for the pieces that need another look.', video: 'gold-zari-single-needle.mp4', image: 'golden-embroidery-navy.webp', alt: 'Gold floral embroidery taking shape on deep navy fabric', note: 'Progress, without losing the detail', position: 'center' },
  { id: 'finish', label: 'The finishing', phase: '04 / INSPECTION', title: 'Made with care.\nFinished with intent.', description: 'A closer look before the final fold. Separate what is ready from what needs attention, and let quality have its own place in the journey.', video: 'gold-zari-embroidery-array.mp4', image: 'quality-inspection.webp', alt: 'An artisan carefully inspecting and trimming the edge of gold-embroidered navy fabric', note: 'A clear path through inspection', position: 'center' },
  { id: 'handover', label: 'The handover', phase: '05 / DISPATCH', title: 'The final touch.\nA new beginning.', description: 'Folded, packed and ready for its next chapter. Connect the final handover to the same process that started it all.', image: 'luxury-packaging-handoff.webp', alt: 'A carefully packaged garment presented in a dark luxury box', note: 'From the first roll to the final handover', position: 'center' },
];

const WORKFLOWS = [
  { label: 'Textiles', title: 'A textile journey, connected.', description: 'From fabric inward to the final fold. Start with a textile template, then make the stages your own.', stages: ['Fabric inward', 'Embroidery', 'Inspection', 'Packing', 'Dispatch'], unit: 'Pieces · metres · rolls' },
  { label: 'Furniture', title: 'A different craft. The same clarity.', description: 'Materials, assembly and finishing. Give your workshop a process that reflects the way your team works.', stages: ['Materials', 'Cutting', 'Assembly', 'Finishing', 'Dispatch'], unit: 'Individual items · batches' },
  { label: 'Your process', title: 'Your stages. Your way of working.', description: 'Start with a blank workflow. Name the stages, choose your units and decide where inspection belongs.', stages: ['Your intake', 'Your production', 'Your inspection', 'Your finish', 'Your handover'], unit: 'Choose your measurement units' },
];

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches);
  useEffect(() => {
    const media = window.matchMedia(query);
    const update = () => setMatches(media.matches);
    update(); media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, [query]);
  return matches;
}

interface Props {
  onGoToWorkspace: () => void;
  onGoToOnboarding: () => void;
  onGoToLogin: () => void;
  onGoToPlatformAdmin?: () => void;
  isPlatformAdmin?: boolean;
}

export const StoryExperience: React.FC<Props> = ({ onGoToWorkspace, onGoToOnboarding, onGoToLogin, onGoToPlatformAdmin, isPlatformAdmin }) => {
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const compact = useMediaQuery('(max-width: 760px)');
  const [motionPaused, setMotionPaused] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const [workflowIdx, setWorkflowIdx] = useState(0);
  const [heroInView, setHeroInView] = useState(true);
  const [heroFailed, setHeroFailed] = useState(false);
  const [storyNearViewport, setStoryNearViewport] = useState(false);
  const [failedClips, setFailedClips] = useState<Set<number>>(() => new Set());
  const heroRef = useRef<HTMLElement>(null);
  const heroVideoRef = useRef<HTMLVideoElement>(null);
  const storyRef = useRef<HTMLElement>(null);
  const screenRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const localProgress = useRef(0);
  const inViewRef = useRef(false);
  const activeRef = useRef(0);
  const lastSeek = useRef(0);
  const scrubFrame = useRef(0);
  const staticStory = reducedMotion || compact;
  const animateVideo = !staticStory && !motionPaused;
  const workflow = WORKFLOWS[workflowIdx];

  useEffect(() => {
    const previousTitle = document.title;
    document.title = 'Textflow — The craft. The process. The clarity.';
    return () => { document.title = previousTitle; };
  }, []);

  useEffect(() => {
    const story = storyRef.current;
    if (!story || staticStory) return;
    const observer = new IntersectionObserver(([entry]) => setStoryNearViewport(entry.isIntersecting), { rootMargin: '200px' });
    observer.observe(story);
    return () => observer.disconnect();
  }, [staticStory]);

  const openOnboarding = () => { window.scrollTo(0, 0); onGoToOnboarding(); };
  const openWorkspace = () => { window.scrollTo(0, 0); onGoToWorkspace(); };
  const openLogin = () => { window.scrollTo(0, 0); onGoToLogin(); };

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;
    const observer = new IntersectionObserver(([entry]) => setHeroInView(entry.isIntersecting), { threshold: 0.1 });
    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const video = heroVideoRef.current;
    if (!video) return;
    const updatePlayback = () => {
      if (animateVideo && heroInView && !document.hidden) void video.play().catch(() => { /* Poster remains visible when autoplay is unavailable. */ });
      else video.pause();
    };
    updatePlayback();
    document.addEventListener('visibilitychange', updatePlayback);
    return () => { video.pause(); document.removeEventListener('visibilitychange', updatePlayback); };
  }, [animateVideo, heroInView]);

  const seekActiveVideo = useCallback(() => {
    const video = videoRefs.current[activeRef.current];
    if (!video || !animateVideo || !inViewRef.current || document.hidden || !Number.isFinite(video.duration) || video.duration <= 0 || video.seeking) return;
    const target = Math.min(Math.max(0, video.duration - 0.05), localProgress.current * video.duration);
    if (Math.abs(video.currentTime - target) > 0.08) {
      try { video.currentTime = target; } catch { /* Keep the poster if the browser cannot seek this clip. */ }
    }
  }, [animateVideo]);

  useEffect(() => {
    if (staticStory) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const el = storyRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const height = screenRef.current?.clientHeight || window.innerHeight;
      inViewRef.current = rect.top < height && rect.bottom > 0;
      if (!inViewRef.current) return;
      const progress = clamp(-rect.top / Math.max(1, el.offsetHeight - height));
      const index = Math.min(CHAPTERS.length - 1, Math.floor(progress * CHAPTERS.length));
      localProgress.current = clamp(progress * CHAPTERS.length - index);
      activeRef.current = index;
      setActiveIdx(previous => previous === index ? previous : index);
      el.style.setProperty('--journey-progress', String(progress));
      if (performance.now() - lastSeek.current > 90) {
        lastSeek.current = performance.now(); seekActiveVideo();
      }
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    const onVisibility = () => { if (!document.hidden) schedule(); };
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    document.addEventListener('visibilitychange', onVisibility);
    update();
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [seekActiveVideo, staticStory]);

  useEffect(() => () => cancelAnimationFrame(scrubFrame.current), []);

  const jumpToChapter = (index: number) => {
    const story = storyRef.current;
    if (!story) return;
    if (staticStory) {
      document.getElementById(`story-${CHAPTERS[index].id}`)?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
      return;
    }
    const top = story.getBoundingClientRect().top + window.scrollY;
    const viewport = screenRef.current?.clientHeight || window.innerHeight;
    window.scrollTo({ top: top + ((index + 0.06) / CHAPTERS.length) * (story.offsetHeight - viewport), behavior: reducedMotion ? 'auto' : 'smooth' });
  };

  const chapterCopy = (index: number) => (
    <>
      <p className="tf-eyebrow tf-chapter-eyebrow"><span>{CHAPTERS[index].phase}</span><span className="tf-fine-line" /></p>
      <h3>{CHAPTERS[index].title.split('\n').map((line, i) => <React.Fragment key={line}>{i > 0 && <br />}{line}</React.Fragment>)}</h3>
      <p className="tf-chapter-description">{CHAPTERS[index].description}</p>
      <span className="tf-chapter-note"><span />{CHAPTERS[index].note}</span>
    </>
  );

  const chooseWorkflowByKey = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    let next = index;
    if (event.key === 'ArrowRight') next = (index + 1) % WORKFLOWS.length;
    else if (event.key === 'ArrowLeft') next = (index + WORKFLOWS.length - 1) % WORKFLOWS.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = WORKFLOWS.length - 1;
    else return;
    event.preventDefault(); setWorkflowIdx(next);
    document.getElementById(`workflow-tab-${next}`)?.focus();
  };

  return (
    <div className="tf-site" id="textflow-top">
      <a className="tf-skip-link" href="#the-platform">Skip the film and explore the workspace</a>
      <header className="tf-header">
        <a href="#textflow-top" className="tf-brand" aria-label="Textflow home"><span className="tf-monogram" aria-hidden="true"><i /><i /><i /></span><span>TEXTFLOW<small>BY TRISHARTH</small></span></a>
        <nav className="tf-desktop-nav" aria-label="Main navigation"><a href="#the-journey">The journey</a><a href="#the-platform">The platform</a><a href="#your-process">Your process</a></nav>
        <div className="tf-header-actions"><button className="tf-login" onClick={openLogin}>Workspace <ArrowUpRight size={14} /></button><button className="tf-menu-toggle" aria-expanded={menuOpen} aria-controls="tf-mobile-navigation" aria-label={menuOpen ? 'Close navigation' : 'Open navigation'} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={21} /> : <Menu size={21} />}</button></div>
        <nav className="tf-mobile-nav" id="tf-mobile-navigation" aria-label="Mobile navigation" hidden={!menuOpen} onKeyDown={event => { if (event.key === 'Escape') { setMenuOpen(false); document.querySelector<HTMLButtonElement>('.tf-menu-toggle')?.focus(); } }}><a href="#the-journey" onClick={() => setMenuOpen(false)}>The journey</a><a href="#the-platform" onClick={() => setMenuOpen(false)}>The platform</a><a href="#your-process" onClick={() => setMenuOpen(false)}>Your process</a></nav>
      </header>

      <main>
        <section className="tf-hero" ref={heroRef} aria-labelledby="tf-hero-title">
          <div className="tf-hero-media" aria-hidden="true">
            <img src={asset('hero-gold-thread.webp')} alt="" fetchPriority="high" width="1672" height="941" />
            {animateVideo && !heroFailed && <video ref={heroVideoRef} src={asset('hero-craft-loop.mp4')} poster={asset('golden-embroidery-navy.webp')} autoPlay loop muted playsInline preload="metadata" onError={() => setHeroFailed(true)} />}
          </div>
          <div className="tf-hero-shade" aria-hidden="true" />
          <div className="tf-hero-copy">
            <p className="tf-eyebrow"><span className="tf-small-star" aria-hidden="true">✳</span> THE BEAUTY IS IN THE PROCESS</p>
            <h1 id="tf-hero-title">Every thread.<br /><em>One remarkable</em><br />journey.</h1>
            <p className="tf-hero-description">From the first roll to the final handover.<br />Discover the craft. Find clarity in every stage.</p>
            <a href="#the-journey" className="tf-primary tf-hero-action">Follow the thread <ArrowDown size={16} strokeWidth={1.5} /></a>
          </div>
          <div className="tf-hero-side" aria-hidden="true">A STUDY IN CRAFT & PRECISION — VOL. 01</div>
          <div className="tf-hero-bottom"><span>01 — MATERIAL TO MASTERPIECE</span><a href="#the-platform">The workspace behind the work <ArrowUpRight size={14} /></a><button className="tf-motion-toggle" onClick={() => setMotionPaused(!motionPaused)} aria-pressed={motionPaused} disabled={reducedMotion || compact}>{reducedMotion || compact ? <><Pause size={12} /> Still-image experience</> : motionPaused ? <><Play size={12} /> Resume motion</> : <><Pause size={12} /> Pause motion</>}</button></div>
        </section>

        <section className="tf-intro" id="the-journey" aria-labelledby="tf-intro-title"><p className="tf-eyebrow">THE JOURNEY / FIVE CHAPTERS</p><div className="tf-intro-row"><h2 id="tf-intro-title">Extraordinary work.<br /><em>One considered step at a time.</em></h2><div><p>There is more to a finished piece than what meets the eye. Materials, machines, people. Every stage has a part to play.</p><p className="tf-intro-small">Explore an illustrative textile journey, from arrival to handover.</p><button className="tf-text-link" onClick={() => jumpToChapter(0)}>Begin the story <ArrowDown size={15} /></button></div></div></section>

        <section className={`tf-journey ${staticStory ? 'tf-journey-static' : ''}`} ref={storyRef} aria-label="A textile journey in five chapters">
          {staticStory ? CHAPTERS.map((chapter, index) => <article className="tf-static-chapter" id={`story-${chapter.id}`} key={chapter.id}><div className="tf-static-image"><img src={asset(chapter.image)} alt={chapter.alt} loading="lazy" width="1672" height="941" /></div><div className="tf-static-copy">{chapterCopy(index)}</div></article>) : <div className="tf-story-screen" ref={screenRef}>
            {CHAPTERS.map((chapter, index) => <div key={chapter.id} className={`tf-story-layer ${index === activeIdx ? 'is-active' : ''}`} aria-hidden="true"><img src={asset(chapter.image)} alt="" loading="lazy" width="1672" height="941" style={{ objectPosition: chapter.position }} />{chapter.video && index === activeIdx && animateVideo && storyNearViewport && !failedClips.has(index) && <video ref={el => { videoRefs.current[index] = el; }} src={asset(chapter.video)} poster={asset(chapter.image)} muted playsInline preload="metadata" onLoadedMetadata={() => { cancelAnimationFrame(scrubFrame.current); scrubFrame.current = requestAnimationFrame(seekActiveVideo); }} onSeeked={() => { if (inViewRef.current) { cancelAnimationFrame(scrubFrame.current); scrubFrame.current = requestAnimationFrame(seekActiveVideo); } }} onError={() => setFailedClips(previous => new Set(previous).add(index))} />}</div>)}
            <div className="tf-story-scrim" aria-hidden="true" />
            <div className="tf-story-top"><a href="#textflow-top">TEXTFLOW / THE JOURNEY</a><a href="#the-platform">Skip to the platform <ArrowUpRight size={14} /></a></div>
            <div className="tf-chapter-copy" key={activeIdx}>{chapterCopy(activeIdx)}</div>
            <div className="tf-chapter-number" aria-hidden="true">0{activeIdx + 1}<span>/ 05</span></div>
            <nav className="tf-chapter-nav" aria-label="Story chapters">{CHAPTERS.map((chapter, index) => <button key={chapter.id} aria-current={index === activeIdx ? 'step' : undefined} onClick={() => jumpToChapter(index)}><span>0{index + 1}</span>{chapter.label}<ArrowUpRight size={13} /></button>)}</nav>
            <div className="tf-journey-progress" aria-hidden="true" />
          </div>}
        </section>

        <section className="tf-platform" id="the-platform" aria-labelledby="tf-platform-title"><div className="tf-platform-heading"><p className="tf-eyebrow">THE WORKSPACE BEHIND THE WORK</p><h2 id="tf-platform-title">The craft is complex.<br /><em>Your workflow shouldn’t be.</em></h2><p>Textflow brings your stages, materials and orders into one workspace. Built around the way your factory works.</p></div><div className="tf-capabilities">{[
          ['01', 'Know where the work is.', 'Follow jobs through your own stages, including inspection and rework.'],
          ['02', 'Give materials a place.', 'Organise stock, choose measurement units and record consumption against jobs.'],
          ['03', 'See what is ready.', 'Keep dispatch preparation connected to the production work that came before it.'],
        ].map(([number, title, description]) => <article key={number}><span>{number}</span><h3>{title}</h3><p>{description}</p></article>)}</div></section>

        <section className="tf-process" id="your-process" aria-labelledby="tf-process-title"><div className="tf-process-photo"><img src={asset('atelier-material-planning.webp')} alt="A production planning desk with fabric swatches, oak, metal and a blank job card" loading="lazy" width="1672" height="941" /><span>THE PROCESS IS YOURS.</span></div><div className="tf-process-content"><p className="tf-eyebrow">CONFIGURE, DON’T COMPROMISE</p><h2 id="tf-process-title">Different factories.<br /><em>A process of your own.</em></h2><p>Start with a template or a blank canvas. Choose the modules you need, define your stages and bring your team into the picture.</p><div className="tf-workflow-tabs" role="tablist" aria-label="Example factory workflows">{WORKFLOWS.map((item, index) => <button key={item.label} id={`workflow-tab-${index}`} role="tab" aria-selected={workflowIdx === index} aria-controls="workflow-example" tabIndex={workflowIdx === index ? 0 : -1} onKeyDown={event => chooseWorkflowByKey(event, index)} onClick={() => setWorkflowIdx(index)}>{item.label}</button>)}</div><div className="tf-workflow-example" id="workflow-example" role="tabpanel" aria-labelledby={`workflow-tab-${workflowIdx}`} tabIndex={0}><span className="tf-example-label">ILLUSTRATIVE WORKFLOW</span><h3>{workflow.title}</h3><p>{workflow.description}</p><ol>{workflow.stages.map((stage, index) => <li key={stage}><span>{index === workflow.stages.length - 1 ? <Check size={11} /> : `0${index + 1}`}</span>{stage}</li>)}</ol><div className="tf-unit-label">{workflow.unit}</div></div><button className="tf-text-link" onClick={openOnboarding}>Make it your own <ArrowUpRight size={16} /></button></div></section>

        <section className="tf-closing" aria-labelledby="tf-closing-title"><p className="tf-eyebrow">YOUR NEXT CHAPTER</p><h2 id="tf-closing-title">Make room for<br /><em>remarkable work.</em></h2><p>A clearer process starts with your first stage.</p><div className="tf-closing-actions"><button className="tf-primary" onClick={openOnboarding}>Create your workspace <ArrowUpRight size={16} /></button><button className="tf-text-link" onClick={openWorkspace}>Already have a workspace? <ArrowRight size={16} /></button></div></section>
      </main>

      <footer className="tf-footer"><a href="#textflow-top" className="tf-brand"><span className="tf-monogram" aria-hidden="true"><i /><i /><i /></span><span>TEXTFLOW<small>BY TRISHARTH</small></span></a><p>Thoughtful craft. Clearer operations.</p><div><span>© {new Date().getFullYear()} Trisharth</span>{isPlatformAdmin && onGoToPlatformAdmin && <button onClick={() => { openWorkspace(); onGoToPlatformAdmin?.(); }}>Platform admin <ArrowUpRight size={12} /></button>}<a href="#textflow-top">Back to top <ArrowUpRight size={12} /></a></div></footer>
    </div>
  );
};
