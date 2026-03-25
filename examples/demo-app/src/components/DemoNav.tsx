import React from 'react';

type DemoNavProps<T extends string> = {
  screens: Array<{ id: T; label: string }>;
  activeScreen: T;
  onSelect: (id: T) => void;
};

export function DemoNav<T extends string>({ screens, activeScreen, onSelect }: DemoNavProps<T>) {
  return (
    <nav className="demo-nav" aria-label="Demo navigation">
      {screens.map((screen) => (
        <button key={screen.id} type="button" data-active={screen.id === activeScreen} onClick={() => onSelect(screen.id)}>
          {screen.label}
        </button>
      ))}
    </nav>
  );
}
