"use client";

import type * as React from "react";
import { Launch } from "@carbon/icons-react";
import { Link } from "@carbon/react";
import { copy } from "@/data/angeronia";

/**
 * A Carbon `Link` that opens in a new tab, and says so.
 *
 * Carbon's `Link` takes `renderIcon` and draws the launch glyph in the right
 * place, but it has no opinion about the rest of the external-link contract:
 * `target`, a safe `rel`, and — the part an arrow glued to a label cannot do —
 * announcing "opens in a new tab" to a screen reader. That is all this adds.
 *
 * `"use client"` is load-bearing: `renderIcon` takes a *component*, and a
 * function cannot cross the server/client boundary. Handing `Launch` to Carbon
 * from a server component fails the prerender, so the handover happens here,
 * already on the client side.
 */
export interface ExternalLinkProps
  extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "children"> {
  href: string;
  children: React.ReactNode;
}

export function ExternalLink({ href, children, ...rest }: ExternalLinkProps) {
  return (
    <Link {...rest} href={href} target="_blank" rel="noreferrer noopener" renderIcon={Launch}>
      {children}
      <span className="cds--visually-hidden"> ({copy.externalLink})</span>
    </Link>
  );
}
