import type { CSSProperties } from "react";

interface Styles {
  trigger: CSSProperties;
  triggerHover: CSSProperties;
  panel: CSSProperties;
  resizeHandle: CSSProperties;
  header: CSSProperties;
  tabBar: CSSProperties;
  tab: CSSProperties;
  tabActive: CSSProperties;
  tabCount: CSSProperties;
  content: CSSProperties;
  splitContainer: CSSProperties;
  sidebar: CSSProperties;
  sidebarItem: CSSProperties;
  sidebarItemActive: CSSProperties;
  searchInput: CSSProperties;
  detailPanel: CSSProperties;
  detailTitle: CSSProperties;
  detailDescription: CSSProperties;
  detailSection: CSSProperties;
  detailSectionTitle: CSSProperties;
  listItem: CSSProperties;
  listItemName: CSSProperties;
  listItemDescription: CSSProperties;
  listItemMeta: CSSProperties;
  expandButton: CSSProperties;
  schemaView: CSSProperties;
  emptyState: CSSProperties;
  emptyStateHeading: CSSProperties;
  emptyStateLink: CSSProperties;
  closeButton: CSSProperties;
  badge: CSSProperties;
}

const baseStyles: Styles = {
  trigger: {
    position: "fixed",
    bottom: 16,
    right: 16,
    width: 48,
    height: 48,
    borderRadius: "50%",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 99999,
    padding: 0,
    transition: "transform 150ms ease, box-shadow 150ms ease",
    backgroundColor: "#ffffff",
    color: "#1a1a2e",
    boxShadow: "0 0 12px var(--tdt-glow)",
  },
  triggerHover: {
    transform: "scale(1.05)",
    boxShadow: "0 0 20px var(--tdt-glow-hover)",
  },
  panel: {
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "var(--tdt-bg)",
    borderTop: "1px solid var(--tdt-border)",
    boxShadow: "0 -4px 20px var(--tdt-shadow)",
    zIndex: 99999,
    display: "flex",
    flexDirection: "column",
    fontFamily:
      'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    fontSize: 13,
    color: "var(--tdt-text)",
  },
  resizeHandle: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 6,
    cursor: "ns-resize",
    touchAction: "none",
    userSelect: "none",
    backgroundColor: "transparent",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "8px 12px",
    borderBottom: "1px solid var(--tdt-border-subtle)",
    flexShrink: 0,
  },
  tabBar: {
    display: "flex",
    gap: 4,
  },
  tab: {
    padding: "4px 10px",
    borderRadius: 6,
    border: "none",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 500,
    backgroundColor: "transparent",
    color: "var(--tdt-text-muted)",
    transition: "background-color 100ms ease, color 100ms ease",
  },
  tabActive: {
    backgroundColor: "var(--tdt-active-bg)",
    color: "var(--tdt-accent)",
  },
  tabCount: {
    marginLeft: 4,
    opacity: 0.6,
  },
  content: {
    flex: 1,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  },
  splitContainer: {
    display: "flex",
    flex: 1,
    overflow: "hidden",
  },
  sidebar: {
    width: 220,
    borderRight: "1px solid var(--tdt-border-subtle)",
    overflowY: "auto",
    flexShrink: 0,
  },
  sidebarItem: {
    padding: "6px 12px",
    cursor: "pointer",
    fontSize: 13,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    color: "var(--tdt-text)",
    transition: "background-color 100ms ease",
  },
  sidebarItemActive: {
    backgroundColor: "var(--tdt-active-bg)",
    fontWeight: 600,
  },
  searchInput: {
    flex: 1,
    padding: "4px 8px",
    borderRadius: 6,
    border: "1px solid var(--tdt-border)",
    backgroundColor: "transparent",
    fontSize: 12,
    color: "var(--tdt-text)",
    minWidth: 0,
  },
  detailPanel: {
    flex: 1,
    overflowY: "auto",
    padding: 16,
  },
  detailTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: "var(--tdt-text)",
  },
  detailDescription: {
    fontSize: 13,
    color: "var(--tdt-text-muted)",
    marginTop: 4,
  },
  detailSection: {
    marginTop: 16,
  },
  detailSectionTitle: {
    fontSize: 11,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    color: "var(--tdt-text-muted)",
    marginBottom: 8,
  },
  listItem: {
    padding: "8px 0",
    borderBottom: "1px solid var(--tdt-border-subtle)",
  },
  listItemName: {
    fontWeight: 600,
    fontSize: 13,
    color: "var(--tdt-text)",
  },
  listItemDescription: {
    fontSize: 12,
    color: "var(--tdt-text-muted)",
    marginTop: 2,
  },
  listItemMeta: {
    fontSize: 11,
    color: "var(--tdt-text-faint)",
    marginTop: 4,
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },
  expandButton: {
    fontSize: 11,
    color: "var(--tdt-accent)",
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "2px 0",
    marginTop: 4,
  },
  schemaView: {
    backgroundColor: "var(--tdt-code-bg)",
    border: "1px solid var(--tdt-border-subtle)",
    borderRadius: 6,
    padding: 8,
    fontSize: 11,
    lineHeight: 1.5,
    overflow: "auto",
    maxHeight: 200,
    marginTop: 4,
    fontFamily: 'ui-monospace, "Cascadia Code", "Fira Code", monospace',
    color: "var(--tdt-text-code)",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  },
  emptyState: {
    padding: 24,
    textAlign: "center",
    color: "var(--tdt-text-faint)",
  },
  emptyStateHeading: {
    fontSize: 14,
    fontWeight: 500,
    marginBottom: 4,
    color: "var(--tdt-text-muted)",
  },
  emptyStateLink: {
    color: "var(--tdt-accent)",
    textDecoration: "underline",
    cursor: "pointer",
    fontSize: 13,
  },
  closeButton: {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: 4,
    color: "var(--tdt-text-muted)",
    fontSize: 16,
    lineHeight: 1,
    borderRadius: 4,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    display: "inline-block",
    padding: "1px 6px",
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 500,
    backgroundColor: "var(--tdt-active-bg)",
    color: "var(--tdt-accent)",
  },
};

/**
 * @returns Style objects for all devtools components
 */
export const getStyles = (): Styles => baseStyles;
