"use client";

import React from "react";

type RenderGuardProps = {
  fallback?: React.ReactNode;
  children: React.ReactNode;
};

type RenderGuardState = {
  hasError: boolean;
};

export class RenderGuard extends React.Component<RenderGuardProps, RenderGuardState> {
  state: RenderGuardState = { hasError: false };

  static getDerivedStateFromError(): RenderGuardState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    // Keep chat alive even if a child widget fails.
    console.error("RenderGuard caught error", error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? null;
    }
    return this.props.children;
  }
}
