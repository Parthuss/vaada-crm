"use client";

import { useEffect, useRef } from "react";

const focusableSelector = [
  "button:not([disabled])",
  "[href]",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

export function useDialogA11y(open: boolean, onDismiss: () => void) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const onDismissRef = useRef(onDismiss);
  const triggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    onDismissRef.current = onDismiss;
  }, [onDismiss]);

  // Tracked continuously rather than read when the dialog opens: React applies `autoFocus`
  // during commit, before any effect runs, so reading the active element on open would capture
  // a field inside the dialog instead of the trigger that should regain focus on close.
  // Containment is tested against the DOM rather than dialogRef because that commit-time focus
  // lands before React attaches the ref.
  useEffect(() => {
    const onFocusIn = (event: FocusEvent) => {
      const target = event.target;
      if (target instanceof HTMLElement && !target.closest('[role="dialog"]')) {
        triggerRef.current = target;
      }
    };
    document.addEventListener("focusin", onFocusIn, true);
    return () => document.removeEventListener("focusin", onFocusIn, true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    const focusInitial = () => {
      // Respect focus already placed inside the dialog (e.g. an `autoFocus` field) instead of
      // pulling the user onto the close button.
      if (dialog?.contains(document.activeElement)) return;
      const initial = dialog?.querySelector<HTMLElement>("[autofocus]");
      const first = dialog?.querySelector<HTMLElement>(focusableSelector);
      (initial ?? first ?? dialog)?.focus();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onDismissRef.current();
        return;
      }
      if (event.key !== "Tab" || !dialog) return;
      const items = Array.from(dialog.querySelectorAll<HTMLElement>(focusableSelector));
      if (!items.length) {
        event.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    const frame = requestAnimationFrame(focusInitial);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      // Cancel first: a pending frame would otherwise move focus into a dialog that is closing.
      cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKeyDown);
      const trigger = triggerRef.current;
      if (trigger?.isConnected) trigger.focus();
    };
  }, [open]);

  return dialogRef;
}
