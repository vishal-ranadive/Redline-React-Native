import React from 'react';
import MainLayout from './MainLayout';

// Add the `extends object` and `IntrinsicAttributes` constraint
export function withMainLayout<P extends object>(
  Component: React.ComponentType<P>
) {
  const WrappedScreen: React.FC<P> = (props) => (
    <MainLayout>
      <Component {...(props as P)} />
    </MainLayout>
  );

  // Give it a proper display name for debugging
  WrappedScreen.displayName = `withMainLayout(${
    Component.displayName || Component.name || 'Component'
  })`;

  return WrappedScreen;
}
