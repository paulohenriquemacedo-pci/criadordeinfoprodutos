export interface CanvasElement {
  id: string;
  type: "text" | "image" | "shape" | "logo";
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  locked: boolean;
  visible: boolean;
  zIndex: number;
  // Text props
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontStyle?: string; // "normal" | "bold" | "italic" | "bold italic"
  fill?: string;
  align?: string;
  lineHeight?: number;
  letterSpacing?: number;
  textDecoration?: string;
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  // Image props
  src?: string;
  // Shape props
  shapeType?: "rect" | "circle" | "line";
  stroke?: string;
  strokeWidth?: number;
  cornerRadius?: number;
}

export interface CanvasConfig {
  width: number;
  height: number;
  backgroundColor: string;
  backgroundGradient?: string;
}

export type ToolMode = "select" | "text" | "shape" | "pan";
