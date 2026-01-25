interface TextInputPanelProps {
  value: string;
  onChange: (value: string) => void;
}

export default function TextInputPanel({ value, onChange }: TextInputPanelProps) {
  const charCount = value.length;

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <label htmlFor="text-input" className="text-lg font-semibold text-gray-900">
          Your Text
        </label>
        <span className="text-sm text-gray-500">
          {charCount} character{charCount !== 1 ? 's' : ''}
        </span>
      </div>
      <textarea
        id="text-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Paste or type your text here... Try entering an article, paragraph, or any text you'd like to transform using AI."
        className="w-full min-h-[200px] p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y transition-all text-gray-900 placeholder-gray-400"
        rows={8}
      />
    </div>
  );
}
