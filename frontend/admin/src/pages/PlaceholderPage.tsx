import React from 'react';
import { Construction } from 'lucide-react';

interface PlaceholderPageProps {
  title: string;
  description: string;
}

export const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ title, description }) => {
  return (
    <div className="placeholder-page">
      <div className="placeholder-card">
        <div className="placeholder-icon-wrapper">
          <Construction size={40} color="#10B981" />
        </div>
        <h2>{title}</h2>
        <p>{description}</p>
        <span className="coming-soon-badge">Tính năng đang được phát triển</span>
      </div>
    </div>
  );
};
