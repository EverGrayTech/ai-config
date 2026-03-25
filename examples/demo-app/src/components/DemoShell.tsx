import React from 'react';

type DemoShellProps = {
  title: string;
  designSystemMode: boolean;
  onToggleDesignSystemMode: () => void;
  children: React.ReactNode;
};

export function DemoShell({ title, designSystemMode, onToggleDesignSystemMode, children }: DemoShellProps) {
  return (
    <main className="demo-main">
      <div className="demo-toolbar">
        <h2>{title}</h2>
        <button type="button" onClick={onToggleDesignSystemMode}>
          {designSystemMode ? 'Disable design-system token simulation' : 'Enable design-system token simulation'}
        </button>
        <p className="demo-note">
          Neutral mode validates this repo alone. Design-system mode simulates the presence of shared EverGray CSS variables without creating a package dependency.
        </p>
      </div>
      {children}
    </main>
  );
}
