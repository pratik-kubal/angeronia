"use client";

import * as React from "react";
import { OverflowMenuVertical } from "@carbon/icons-react";
import { cx, type ClassValue } from "@/lib/slds/cx";

export interface MenuItem {
  id: string;
  label: string;
  onSelect?: () => void;
  disabled?: boolean;
}

/**
 * The SLDS 2 Menu blueprint, driven by a Button Icon.
 *
 * A menu is not a listbox and not a dialog: the trigger owns
 * `aria-haspopup="true"` and `aria-expanded`, the items are `role="menuitem"`
 * inside `role="menu"`, and the keyboard contract is arrows to move, Enter or
 * Space to choose, Escape to leave — with focus returning to the trigger every
 * time it closes, so a keyboard user is never dropped at the top of the page.
 */
export interface ButtonMenuProps {
  items: MenuItem[];
  /** Accessible name for the trigger. */
  label: string;
  align?: "left" | "right";
  className?: ClassValue;
}

export function ButtonMenu({ items, label, align = "left", className }: ButtonMenuProps) {
  const id = React.useId();
  const [open, setOpen] = React.useState(false);
  const [focused, setFocused] = React.useState(0);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const itemRefs = React.useRef<(HTMLAnchorElement | null)[]>([]);

  const close = React.useCallback(
    (returnFocus = true) => {
      setOpen(false);
      if (returnFocus) triggerRef.current?.focus();
    },
    [],
  );

  React.useEffect(() => {
    if (!open) return;
    itemRefs.current[focused]?.focus();
  }, [open, focused]);

  React.useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (itemRefs.current.some((node) => node?.contains(target))) return;
      close(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open, close]);

  const onMenuKeyDown = (event: React.KeyboardEvent) => {
    // Every branch below indexes modulo `items.length`; with no items that is
    // NaN, which would flow into `tabIndex` and the focus effect.
    if (items.length === 0) return;

    switch (event.key) {
      case "Escape":
        event.preventDefault();
        close();
        break;
      // A menuitem is an `<a href="#">`, which fires `click` on Enter but not
      // on Space — Space scrolls the page instead. The ARIA menu pattern
      // requires both, so Space is routed to the focused item by hand.
      case " ":
        event.preventDefault();
        itemRefs.current[focused]?.click();
        break;
      case "ArrowDown":
        event.preventDefault();
        setFocused((i) => (i + 1) % items.length);
        break;
      case "ArrowUp":
        event.preventDefault();
        setFocused((i) => (i - 1 + items.length) % items.length);
        break;
      case "Home":
        event.preventDefault();
        setFocused(0);
        break;
      case "End":
        event.preventDefault();
        setFocused(items.length - 1);
        break;
      default:
    }
  };

  return (
    <div
      className={cx(
        "slds-dropdown-trigger slds-dropdown-trigger_click",
        open && "slds-is-open",
        className,
      )}
    >
      <button
        type="button"
        ref={triggerRef}
        className="slds-button slds-button_icon slds-button_icon-border-filled"
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => {
          setFocused(0);
          setOpen((v) => !v);
        }}
      >
        <OverflowMenuVertical
          className="slds-button__icon"
          size={16}
          aria-hidden="true"
          focusable="false"
        />
        <span className="slds-assistive-text">{label}</span>
      </button>

      <div
        id={id}
        className={cx("slds-dropdown", `slds-dropdown_${align}`)}
        hidden={!open}
      >
        <ul className="slds-dropdown__list" role="menu" aria-label={label} onKeyDown={onMenuKeyDown}>
          {items.map((item, index) => (
            <li key={item.id} className="slds-dropdown__item" role="presentation">
              <a
                href="#"
                role="menuitem"
                tabIndex={index === focused ? 0 : -1}
                aria-disabled={item.disabled || undefined}
                ref={(node) => {
                  itemRefs.current[index] = node;
                }}
                onClick={(event) => {
                  event.preventDefault();
                  if (item.disabled) return;
                  item.onSelect?.();
                  close();
                }}
              >
                <span className="slds-truncate">{item.label}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
