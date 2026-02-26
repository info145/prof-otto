declare module "react-katex" {
  import type * as React from "react";

  type RenderError = (error: Error) => React.ReactNode;

  type MathComponentProps = {
    math?: string;
    children?: string;
    errorColor?: string;
    renderError?: RenderError;
  };

  export const BlockMath: React.ComponentType<MathComponentProps>;
  export const InlineMath: React.ComponentType<MathComponentProps>;
}
