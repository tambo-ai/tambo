type ComparisonItem = {
  name: string;
  category: string;
  price: number;
  strengths: string[];
};

type ComparisonTableProps = {
  comparison: ComparisonItem[];
};

export function ComparisonTable({ comparison }: ComparisonTableProps) {
  return (
    <div 
      className="empty-state" 
      style={{ 
        overflowX: "auto", 
        padding: 0,
        border: "1px solid #e5e7eb",
        borderRadius: 8,
        backgroundColor: "white",
        marginTop: 16
      }}
    >
      <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.875rem" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid #e5e7eb", backgroundColor: "#f9fafb" }}>
            <th style={{ padding: "12px 16px", color: "#6b7280", fontWeight: 500 }}>Product</th>
            <th style={{ padding: "12px 16px", color: "#6b7280", fontWeight: 500 }}>Category</th>
            <th style={{ padding: "12px 16px", color: "#6b7280", fontWeight: 500 }}>Price</th>
            <th style={{ padding: "12px 16px", color: "#6b7280", fontWeight: 500 }}>Key Tags</th>
          </tr>
        </thead>
        <tbody>
          {comparison.map((item, i) => (
            <tr key={i} style={{ borderBottom: i === comparison.length - 1 ? "none" : "1px solid #f3f4f6" }}>
              <td style={{ padding: "12px 16px", fontWeight: 500, color: "#111827" }}>{item.name}</td>
              <td style={{ padding: "12px 16px", color: "#374151" }}>{item.category}</td>
              <td style={{ padding: "12px 16px", color: "#111827" }}>${item.price}</td>
              <td style={{ padding: "12px 16px" }}>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {item.strengths.map((s, si) => (
                    <span 
                      key={si} 
                      style={{ 
                        fontSize: "0.75rem", 
                        background: "#f3f4f6", 
                        padding: "2px 6px", 
                        borderRadius: 4,
                        color: "#4b5563"
                      }}
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
