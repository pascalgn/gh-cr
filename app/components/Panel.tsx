import { Paper } from "@mantine/core";
import type { ReactNode } from "react";

import "./Panel.css";

interface PanelProps {
  title: ReactNode;
  actions?: ReactNode;
  /** DOM id, so callers can scroll a panel into view. */
  id?: string;
  /** Drop the body padding, e.g. when the body is a full-bleed diff. */
  flush?: boolean;
  children: ReactNode;
}

/** A titled section container: header row with optional right-aligned actions. */
export function Panel({ title, actions, id, flush, children }: PanelProps) {
  return (
    <Paper withBorder radius="md" className="panel" id={id}>
      <div className="panel-header">
        <div className="panel-title">{title}</div>
        {actions ? <div className="panel-actions">{actions}</div> : null}
      </div>
      <div className={flush ? "panel-body panel-body--flush" : "panel-body"}>
        {children}
      </div>
    </Paper>
  );
}
