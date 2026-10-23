import React from 'react';

interface SectionCardProps {
  children: React.ReactNode;
  className?: string;
}

const SectionCard: React.FC<SectionCardProps> = ({ children, className='' }) => (
  <section className={`w-full bg-white rounded-xl shadow p-4 sm:p-6 space-y-4 ${className}`}>
    {children}
  </section>
);
export default SectionCard;
