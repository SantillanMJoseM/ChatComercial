import React from 'react';

export default function Badge({ children, color = '#6366f1', className = '' }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${className}`} style={{ backgroundColor: color }}>
      {children}
    </span>
  );
}