type EscEntry = { run: () => void };
const escRegistry: EscEntry[] = [];

// the shell calls this from its global Escape handling. Escape dismisses one
// layer at a time: only the most recently registered consumer runs, so a picker
// opened inside a modal collapses on the first Escape and the modal survives
// until the next (a picker registers after the modal it sits in).
export function dismissEscapeConsumers(): void {
  escRegistry[escRegistry.length - 1]?.run();
}

// exported for chrome that shares the modal's Escape and Android-back
// behavior without its title-bar frame (the floating pickers): registered
// closers are invoked by the shell's Escape path, so Esc closes them the
// same way it closes an AppModal
export function registerEsc(run: () => void): () => void {
  const entry = { run };
  escRegistry.push(entry);
  return () => {
    const i = escRegistry.indexOf(entry);
    if (i >= 0) escRegistry.splice(i, 1);
  };
}
