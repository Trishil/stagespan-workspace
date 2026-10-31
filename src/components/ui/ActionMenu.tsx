import React, {useEffect, useRef} from 'react';
import {MoreHorizontal} from 'lucide-react';

/** Secondary actions remain discoverable without competing with the primary task. */
export function ActionMenu({children, label = 'More actions'}: {children: React.ReactNode; label?: string}) {
  const ref = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const outside = (event: PointerEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) ref.current.open = false;
    };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, []);
  return <details className="tf-action-menu" ref={ref} onKeyDown={event => {
    if(event.key === 'Escape') {event.preventDefault(); if(ref.current) ref.current.open = false; ref.current?.querySelector('summary')?.focus();}
  }}>
    <summary aria-label={label}><MoreHorizontal size={17}/><span>{label}</span></summary>
    <div className="tf-action-menu-panel" onClick={event => {
      if ((event.target as Element).closest('button,a')) {
        if(ref.current) ref.current.open = false;
        ref.current?.querySelector('summary')?.focus();
      }
    }}>{children}</div>
  </details>;
}
