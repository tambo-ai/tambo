interface ActionButtonsProps {
  onAction: (action: string) => void;
  selectedAction: string | null;
  disabled: boolean;
}

const actions = [
  {
    id: 'explain',
    label: 'Explain',
    icon: '💡',
    description: 'Get a detailed explanation',
    color: 'from-blue-500 to-blue-600',
  },
  {
    id: 'summarize',
    label: 'Summarize',
    icon: '📝',
    description: 'Create a concise summary',
    color: 'from-purple-500 to-purple-600',
  },
  {
    id: 'simplify',
    label: 'Simplify',
    icon: '✨',
    description: 'Make it easier to understand',
    color: 'from-green-500 to-green-600',
  },
];

export default function ActionButtons({ onAction, selectedAction, disabled }: ActionButtonsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {actions.map((action) => {
        const isSelected = selectedAction === action.id;
        return (
          <button
            key={action.id}
            onClick={() => onAction(action.id)}
            disabled={disabled}
            className={`
              group relative overflow-hidden rounded-xl p-6 text-left transition-all duration-200
              ${
                disabled
                  ? 'opacity-50 cursor-not-allowed bg-gray-100'
                  : isSelected
                    ? `bg-gradient-to-br ${action.color} text-white shadow-lg scale-105`
                    : 'bg-white hover:shadow-lg hover:scale-105 border border-gray-200'
              }
            `}
          >
            <div className="flex items-start gap-3">
              <span className="text-3xl">{action.icon}</span>
              <div className="flex-1">
                <h3
                  className={`text-lg font-semibold mb-1 ${
                    isSelected ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  {action.label}
                </h3>
                <p
                  className={`text-sm ${
                    isSelected ? 'text-blue-50' : 'text-gray-600'
                  }`}
                >
                  {action.description}
                </p>
              </div>
            </div>
            {!disabled && !isSelected && (
              <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
          </button>
        );
      })}
    </div>
  );
}
