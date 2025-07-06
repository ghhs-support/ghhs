import React from 'react';

interface InfoCardAction {
  icon: React.ReactNode;
  onClick: (e: React.MouseEvent) => void;
  title?: string;
  className?: string;
}

interface InfoCardProps {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  phone?: string;
  email?: string;
  notes?: string;
  color?: 'blue' | 'green' | 'purple' | 'red' | 'gray';
  actions?: InfoCardAction[];
  className?: string;
  children?: React.ReactNode;
}

const colorMap = {
  blue: {
    border: 'border-blue-200 dark:border-blue-700',
    title: 'text-blue-200',
    subtitle: 'text-blue-400',
  },
  green: {
    border: 'border-green-200 dark:border-green-700',
    title: 'text-green-200',
    subtitle: 'text-green-400',
  },
  purple: {
    border: 'border-purple-200 dark:border-purple-700',
    title: 'text-purple-200',
    subtitle: 'text-purple-400',
  },
  red: {
    border: 'border-red-200 dark:border-red-700',
    title: 'text-red-200',
    subtitle: 'text-red-400',
  },
  gray: {
    border: 'border-gray-200 dark:border-gray-700',
    title: 'text-gray-100',
    subtitle: 'text-gray-400',
  },
};

/**
 * InfoCard: A flexible card for displaying entity info (tenant, agency, owner, etc.)
 * Uses a consistent dark cell background for all cards.
 */
export default function InfoCard({
  icon,
  title,
  subtitle,
  phone,
  email,
  notes,
  color = 'gray',
  actions,
  className = '',
  children,
}: InfoCardProps) {
  const colorStyles = colorMap[color] || colorMap.gray;
  const bgClass = 'bg-gray-800 dark:bg-gray-900';

  return (
    <div
      className={`rounded-lg border p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-2 ${bgClass} ${colorStyles.border} ${className}`}
    >
      <div className="flex justify-between items-start gap-2">
        <div className="flex items-center gap-2">
          {icon && <span className="shrink-0">{icon}</span>}
          <div>
            <div className={`text-sm font-semibold ${colorStyles.title}`}>{title}</div>
            {subtitle && <div className={`text-xs ${colorStyles.subtitle}`}>{subtitle}</div>}
          </div>
        </div>
        {actions && actions.length > 0 && (
          <div className="flex gap-1">
            {actions.map((action, idx) => (
              <button
                key={idx}
                type="button"
                onClick={action.onClick}
                className={`inline-flex items-center justify-center p-1.5 rounded-md transition-colors ${action.className || ''}`}
                title={action.title}
              >
                {action.icon}
              </button>
            ))}
          </div>
        )}
      </div>
      {phone && (
        <div className="flex items-center gap-1 text-xs text-red-400">
          <span>📞</span>
          <span>{phone}</span>
        </div>
      )}
      {email && (
        <div className={`flex items-center gap-1 text-xs ${colorStyles.subtitle}`}>
          <span>✉️</span>
          <span>{email}</span>
        </div>
      )}
      {notes && (
        <div className="text-xs text-gray-400 italic">{notes}</div>
      )}
      {children}
    </div>
  );
} 