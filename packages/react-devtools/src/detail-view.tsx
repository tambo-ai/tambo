"use client";
import React from "react";
import { SchemaView } from "./schema-view";
import type { getStyles } from "./styles";

interface RegistryItem {
  name: string;
  description?: string;
  schema?: unknown;
  secondarySchema?: unknown;
  schemaLabel?: string;
  secondarySchemaLabel?: string;
  associatedTools?: readonly string[];
}

interface DetailViewProps {
  item: RegistryItem | null;
  styles: ReturnType<typeof getStyles>;
}

/**
 * Detail pane showing full information for the selected registry item.
 * @param props - Selected item and styles
 * @returns Detail view or empty prompt
 */
export const DetailView: React.FC<DetailViewProps> = ({ item, styles }) => {
  if (!item) {
    return (
      <div style={{ ...styles.detailPanel, ...styles.emptyState }}>
        <div style={styles.emptyStateHeading}>
          Select an item to view details
        </div>
      </div>
    );
  }

  return (
    <div style={styles.detailPanel}>
      <div style={styles.detailTitle}>{item.name}</div>
      {item.description && (
        <div style={styles.detailDescription}>{item.description}</div>
      )}

      {item.associatedTools && item.associatedTools.length > 0 && (
        <div style={styles.detailSection}>
          <div style={styles.detailSectionTitle}>Associated Tools</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {item.associatedTools.map((tool) => (
              <span key={tool} style={styles.badge}>
                {tool}
              </span>
            ))}
          </div>
        </div>
      )}

      {!!item.schema && (
        <div style={styles.detailSection}>
          {item.schemaLabel && (
            <div style={styles.detailSectionTitle}>{item.schemaLabel}</div>
          )}
          <SchemaView
            schema={item.schema}
            style={styles.schemaView}
            schemaName="InputSchema"
          />
        </div>
      )}

      {!!item.secondarySchema && (
        <div style={styles.detailSection}>
          {item.secondarySchemaLabel && (
            <div style={styles.detailSectionTitle}>
              {item.secondarySchemaLabel}
            </div>
          )}
          <SchemaView
            schema={item.secondarySchema}
            style={styles.schemaView}
            schemaName="OutputSchema"
          />
        </div>
      )}
    </div>
  );
};
