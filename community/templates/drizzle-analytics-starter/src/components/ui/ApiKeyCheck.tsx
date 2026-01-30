export const ApiKeyCheck = () => {
  const isMissing = !process.env.NEXT_PUBLIC_TAMBO_API_KEY;
  if (!isMissing) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-red-500/50 p-6 rounded-2xl max-w-md text-center shadow-2xl">
        <h2 className="text-xl font-bold text-white mb-2">API Key Missing</h2>
        <p className="text-zinc-400 text-sm mb-4">Please add NEXT_PUBLIC_TAMBO_API_KEY to your .env.local file to start the template.</p>
      </div>
    </div>
  );
};