import React from 'react';
import { LucideIcon } from 'lucide-react';

interface DashboardCardProps {
  title: string;
  value: string;
  icon?: string | LucideIcon;
  description?: string;
  trend?: {
    value: number;
    direction?: 'up' | 'down';
    isPositive?: boolean;
  };
  className?: string;
  isLoading?: boolean;
  onClick?: () => void;
  iconSize?: 'small' | 'medium' | 'large';
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
}

export default function DashboardCard({ 
  title, 
  value, 
  icon: Icon, 
  description,
  trend,
  className = '',
  isLoading = false,
  onClick,
  iconSize = 'medium',
  variant = 'default'
}: DashboardCardProps) {
  // Format large numbers with commas
  const formatValue = (val: string) => {
    const num = parseFloat(val);
    if (!isNaN(num)) {
      return num.toLocaleString();
    }
    return val;
  };
  const iconSizeClasses = {
    small: 'h-4 w-4',
    medium: 'h-6 w-6',
    large: 'h-8 w-8'
  };

  const variantClasses = {
    default: 'bg-card border',
    primary: 'bg-card border-blue-200',
    success: 'bg-card border-green-200',
    warning: 'bg-card border-yellow-200',
    danger: 'bg-card border-destructive'
  };

  const cardClasses = `p-6 rounded-lg shadow-sm ${variantClasses[variant]} ${className}`;

  if (isLoading) {
    return (
      <div className={cardClasses}>
        <div className="flex items-center justify-center">
          <div data-testid="loading-spinner" className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  const content = (
    <div data-testid="dashboard-card" className={cardClasses}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-2 text-3xl font-semibold text-foreground">{formatValue(value)}</p>
          {description && (
            <p className="mt-2 text-sm text-muted-foreground">{description}</p>
          )}
          {trend && (
            <div className={`mt-2 text-sm flex items-center ${
              (trend.direction === 'up' || trend.isPositive) ? 'text-green-600' : 'text-destructive'
            }`}>
              <span data-testid={trend.direction === 'up' ? 'trend-up-icon' : 'trend-down-icon'}>
                {(trend.direction === 'up' || trend.isPositive) ? '↑' : '↓'}
              </span>
              <span className="ml-1">
                {trend.value >= 0 ? '+' : ''}{trend.value}%
              </span>
            </div>
          )}
        </div>
        {Icon && (
          <div className="p-3 bg-primary rounded-full">
            {typeof Icon === 'string' ? (
              <div data-testid="card-icon" className={`text-primary ${iconSizeClasses[iconSize]}`}>
                {Icon}
              </div>
            ) : (
              <Icon data-testid="card-icon" className={`text-primary ${iconSizeClasses[iconSize]}`} />
            )}
          </div>
        )}
      </div>
    </div>
  );

  if (onClick) {
    return (
      <button onClick={onClick} className="w-full text-left">
        {content}
      </button>
    );
  }

  return content;
}