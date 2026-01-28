import { MessageSquare, Tag } from "lucide-react";

type Product = {
  id: number;
  name: string;
  category: string;
  price: number;
  tags: string;
};

type ProductGridProps = {
  products: Product[];
  message?: string;
};

export const ProductGrid = ({ products, message }: ProductGridProps) => {
  if (!products || products.length === 0) {
    return (
      <div className="p-8 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 text-gray-500 flex flex-col items-center justify-center text-center">
        <MessageSquare size={32} className="mb-3 opacity-50" />
        <p className="font-medium text-lg text-gray-700">No matching products</p>
        <p className="text-sm">{message || "Try adjusting your search filters."}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      {products.map((product) => (
        <div key={product.id} className="group border border-gray-200 rounded-xl p-5 bg-white shadow-sm hover:shadow-md transition-all">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="font-semibold text-gray-900 text-lg group-hover:text-blue-600 transition-colors">{product.name}</h3>
              <p className="text-sm text-gray-500 font-medium">{product.category}</p>
            </div>
            <span className="text-base font-bold text-gray-900 bg-gray-100 px-2 py-1 rounded-md">${product.price}</span>
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            {product.tags.split(',').map((tag, i) => (
              <span key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 text-gray-600 text-xs font-medium rounded-full border border-gray-100">
                <Tag size={12} className="opacity-50" />
                {tag.trim()}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
