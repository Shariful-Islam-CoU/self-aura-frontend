"use client";

import { ReactNode, useEffect, useState } from "react";
import { createPortal } from "react-dom";

export function Portal({ children, container }: { children: ReactNode; container?: HTMLElement }) {
  const [mounted, setMounted] = useState(false);
  const [portalEl, setPortalEl] = useState<HTMLDivElement | null>(null);

  // The portal element can only be created after mount (no event handler
  // exists for this lifecycle boundary), so the state is initialized from the
  // effect. This is the documented exception to the set-state-in-effect rule.
  useEffect(() => {
    const target = container ?? document.body;
    const el = document.createElement("div");
    // The portal element only exists on the client after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- portal nodes are created here by design
    setPortalEl(el);
    target.appendChild(el);
    setMounted(true);

    return () => {
      target.removeChild(el);
      setPortalEl(null);
      setMounted(false);
    };
  }, [container]);

  if (!mounted || !portalEl) return null;

  return createPortal(children, portalEl);
}