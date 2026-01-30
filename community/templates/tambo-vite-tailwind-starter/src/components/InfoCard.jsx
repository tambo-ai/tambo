export default function InfoCard() {
  const info = {
    title: "Product Info",
    description: "This is an AI-generated info card.",
    date: new Date().toLocaleDateString()
  };

  return (
    <div className="border rounded p-4 shadow bg-gray-50 dark:bg-gray-700">
      <h2 className="text-lg font-bold mb-2">{info.title}</h2>
      <p className="mb-2">{info.description}</p>
      <p className="text-sm text-gray-500">{info.date}</p>
    </div>
  );
}
