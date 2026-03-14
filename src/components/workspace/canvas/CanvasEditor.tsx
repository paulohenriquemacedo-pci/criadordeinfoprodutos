import { useRef, useEffect, useState, useCallback } from "react";
import { Stage, Layer, Rect, Text, Image as KonvaImage, Transformer } from "react-konva";
import Konva from "konva";
import { CanvasElement, CanvasConfig } from "./types";

interface Props {
  config: CanvasConfig;
  elements: CanvasElement[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onUpdate: (id: string, changes: Partial<CanvasElement>) => void;
  scale: number;
}

function URLImage({ src, ...props }: { src: string } & Record<string, any>) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  useEffect(() => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => setImage(img);
    img.src = src;
  }, [src]);
  return image ? <KonvaImage image={image} {...props} /> : null;
}

export default function CanvasEditor({ config, elements, selectedId, onSelect, onUpdate, scale }: Props) {
  const stageRef = useRef<Konva.Stage>(null);
  const trRef = useRef<Konva.Transformer>(null);

  // Attach transformer to selected node
  useEffect(() => {
    if (!trRef.current || !stageRef.current) return;
    if (selectedId) {
      const node = stageRef.current.findOne(`#${selectedId}`);
      if (node) {
        trRef.current.nodes([node]);
        trRef.current.getLayer()?.batchDraw();
        return;
      }
    }
    trRef.current.nodes([]);
    trRef.current.getLayer()?.batchDraw();
  }, [selectedId, elements]);

  const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (e.target === stageRef.current) {
      onSelect(null);
    }
  };

  const handleDragEnd = (id: string, e: Konva.KonvaEventObject<DragEvent>) => {
    onUpdate(id, { x: e.target.x(), y: e.target.y() });
  };

  const handleTransformEnd = (id: string, e: Konva.KonvaEventObject<Event>) => {
    const node = e.target;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    node.scaleX(1);
    node.scaleY(1);
    onUpdate(id, {
      x: node.x(),
      y: node.y(),
      width: Math.max(20, node.width() * scaleX),
      height: Math.max(20, node.height() * scaleY),
      rotation: node.rotation(),
    });
  };

  const sorted = [...elements].filter(el => el.visible).sort((a, b) => a.zIndex - b.zIndex);

  const renderElement = (el: CanvasElement) => {
    const common = {
      id: el.id,
      key: el.id,
      x: el.x,
      y: el.y,
      rotation: el.rotation,
      opacity: el.opacity,
      draggable: !el.locked,
      onClick: () => onSelect(el.id),
      onTap: () => onSelect(el.id),
      onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => handleDragEnd(el.id, e),
      onTransformEnd: (e: Konva.KonvaEventObject<Event>) => handleTransformEnd(el.id, e),
    };

    switch (el.type) {
      case "text":
        return (
          <Text
            {...common}
            text={el.text || ""}
            fontSize={el.fontSize || 24}
            fontFamily={el.fontFamily || "Arial"}
            fontStyle={el.fontStyle || "normal"}
            fill={el.fill || "#000000"}
            width={el.width}
            height={el.height}
            align={el.align || "left"}
            lineHeight={el.lineHeight || 1.2}
            letterSpacing={el.letterSpacing || 0}
            shadowColor={el.shadowColor}
            shadowBlur={el.shadowBlur || 0}
            shadowOffsetX={el.shadowOffsetX || 0}
            shadowOffsetY={el.shadowOffsetY || 0}
            wrap="word"
          />
        );
      case "image":
      case "logo":
        return el.src ? (
          <URLImage
            {...common}
            src={el.src}
            width={el.width}
            height={el.height}
          />
        ) : null;
      case "shape":
        if (el.shapeType === "circle") {
          return (
            <Rect
              {...common}
              width={el.width}
              height={el.height}
              fill={el.fill || "#000000"}
              cornerRadius={Math.min(el.width, el.height) / 2}
              stroke={el.stroke}
              strokeWidth={el.strokeWidth || 0}
            />
          );
        }
        return (
          <Rect
            {...common}
            width={el.width}
            height={el.height}
            fill={el.fill || "#000000"}
            cornerRadius={el.cornerRadius || 0}
            stroke={el.stroke}
            strokeWidth={el.strokeWidth || 0}
          />
        );
      default:
        return null;
    }
  };

  // Parse background gradient or solid
  const bgFill = config.backgroundColor;

  return (
    <div
      style={{
        width: config.width * scale,
        height: config.height * scale,
        overflow: "hidden",
        borderRadius: 8,
        boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
      }}
    >
      <Stage
        ref={stageRef}
        width={config.width * scale}
        height={config.height * scale}
        scaleX={scale}
        scaleY={scale}
        onClick={handleStageClick}
        onTap={() => onSelect(null)}
        style={{ cursor: "default" }}
      >
        <Layer>
          {/* Background */}
          <Rect x={0} y={0} width={config.width} height={config.height} fill={bgFill} listening={false} />
          {/* Elements */}
          {sorted.map(renderElement)}
          {/* Transformer */}
          <Transformer
            ref={trRef}
            boundBoxFunc={(oldBox, newBox) => {
              if (newBox.width < 20 || newBox.height < 20) return oldBox;
              return newBox;
            }}
            rotateEnabled={true}
            enabledAnchors={[
              "top-left", "top-right", "bottom-left", "bottom-right",
              "middle-left", "middle-right", "top-center", "bottom-center",
            ]}
          />
        </Layer>
      </Stage>
    </div>
  );
}

// Export stage ref getter for PNG export
export function exportStageToPNG(
  stageRef: React.RefObject<Konva.Stage | null>,
  config: CanvasConfig,
  fileName: string
) {
  if (!stageRef.current) return;
  // Temporarily scale to 1:1 for export
  const stage = stageRef.current;
  const oldScaleX = stage.scaleX();
  const oldScaleY = stage.scaleY();
  const oldWidth = stage.width();
  const oldHeight = stage.height();

  stage.scaleX(1);
  stage.scaleY(1);
  stage.width(config.width);
  stage.height(config.height);
  stage.draw();

  const dataURL = stage.toDataURL({ pixelRatio: 1, mimeType: "image/png" });

  // Restore
  stage.scaleX(oldScaleX);
  stage.scaleY(oldScaleY);
  stage.width(oldWidth);
  stage.height(oldHeight);
  stage.draw();

  const link = document.createElement("a");
  link.download = fileName;
  link.href = dataURL;
  link.click();
}
