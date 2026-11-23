// Inline script (run from the root layout via next/script `beforeInteractive`) that restores the
// collapsed desktop sidebar before first paint, so it never flashes open.
// Plain module so the root layout (a Server Component) can import it; keep the key and attribute
// in sync with sidebar-state.ts.
export const SIDEBAR_RESTORE_SCRIPT = `try{if(localStorage.getItem("ptdd.sidebar-collapsed")==="1")document.documentElement.setAttribute("data-sidebar-collapsed","")}catch(e){}`;
