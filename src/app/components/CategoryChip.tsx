import React from 'react';
import { CategoryType, CATEGORY_COLORS, CATEGORY_LABELS } from '../types';

interface CategoryChipProps {
  category: CategoryType;
  size?: 'sm' | 'md';
  className?: string;
}

export function CategoryChip({ category, size = 'md', className = '' }: CategoryChipProps) {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';
  
  return (
    <span className={`inline-flex items-center rounded border ${CATEGORY_COLORS[category]} ${sizeClasses} ${className}`}>
      {CATEGORY_LABELS[category]}
    </span>
  );
}
