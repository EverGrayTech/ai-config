import React from 'react';

type DemoCardProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
};

export function DemoCard({ title, description, children }: DemoCardProps) {
  return (
    <section className="demo-card">
      <h3>{title}</h3>
      {description ? <p className="demo-note">{description}</p> : null}
      {children}
    </section>
  );
}
