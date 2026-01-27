type ProductCardProps = {
  name: string;
  price: number;
  category: string;
  reason: string;
};

export function ProductCard({
  name,
  price,
  category,
  reason,
}: ProductCardProps) {
  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 8,
        padding: 20,
        backgroundColor: "white",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 8,
        }}
      >
        <h3 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 600 }}>
          {name}
        </h3>
        <span style={{ fontSize: "0.875rem", color: "#6b7280" }}>
          ${price}
        </span>
      </div>
      <p style={{ fontSize: "0.875rem", color: "#6b7280", margin: "0 0 12px 0" }}>
        {category}
      </p>
      <p style={{ fontSize: "0.875rem", margin: 0, color: "#374151" }}>
        {reason}
      </p>
    </div>
  );
}
