import {useEffect} from 'react';

/** Applies keyboard containment to existing dialogs, including nested confirmations. */
export function WorkspaceDialogs() {
  useEffect(() => {
    const root = document.querySelector('.tf-workspace');
    if (!root) return;
    let top: HTMLElement | null = null;
    const originalOverflow = document.body.style.overflow;
    const previous = new WeakMap<HTMLElement, HTMLElement>();
    const focusable = (dialog: HTMLElement) => Array.from(dialog.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],input:not(:disabled):not([type="hidden"]),select:not(:disabled),textarea:not(:disabled),summary,[tabindex]:not([tabindex="-1"])')).filter(el => el.getClientRects().length && !el.closest('[hidden],[inert]'));
    const update = () => {
      const dialogs = Array.from(root.querySelectorAll<HTMLElement>('.tf-dialog-layer')).filter(el => el.getClientRects().length);
      const next = dialogs.at(-1) || null;
      if (next === top) return;
      const closing = top;
      top = next;
      document.body.style.overflow = top ? 'hidden' : originalOverflow;
      if (closing && !root.contains(closing)) {
        const target = previous.get(closing);
        if (target?.isConnected) target.focus();
      }
      if (top) {
        if (!previous.has(top)) previous.set(top, document.activeElement as HTMLElement);
        top.setAttribute('role','dialog');top.setAttribute('aria-modal','true');top.tabIndex=-1;
        if (!top.hasAttribute('aria-label') && !top.hasAttribute('aria-labelledby')) {
          top.setAttribute('aria-label', top.querySelector('h1,h2,h3')?.textContent?.trim() || 'Workspace dialog');
        }
        if (!top.contains(document.activeElement)) {
          const heading = top.querySelector<HTMLElement>('h1,h2,h3');
          if(heading) {heading.tabIndex=-1;heading.focus();} else top.focus();
        }
      }
    };
    const keydown = (event: KeyboardEvent) => {
      if (!top) return;
      if(event.key === 'Escape') {
        const close = top.querySelector<HTMLButtonElement>('[data-dialog-close]');
        if(close && !close.disabled) {event.preventDefault(); event.stopPropagation();close.click();}
      }
      if(event.key === 'Tab') {
        const list = focusable(top);const index=list.indexOf(document.activeElement as HTMLElement);
        if(!list.length) {event.preventDefault();top.focus();}
        else if(event.shiftKey && index <= 0) {event.preventDefault();list.at(-1)?.focus();}
        else if(!event.shiftKey && (index < 0 || index === list.length-1)) {event.preventDefault();list[0].focus();}
      }
    };
    const contain = (event: FocusEvent) => {
      if (top && !top.contains(event.target as Node)) (focusable(top)[0] || top).focus();
    };
    const observer = new MutationObserver(update);
    observer.observe(root, {childList:true,subtree:true});
    document.addEventListener('keydown',keydown,true);document.addEventListener('focusin',contain);
    update();
    return () => {document.body.style.overflow = originalOverflow;observer.disconnect();document.removeEventListener('keydown',keydown,true);document.removeEventListener('focusin',contain);};
  },[]);
  return null;
}
