import { forwardRef } from "react";
import { BrandSettings } from "@/hooks/useBrandSettings";
import { PostContentData } from "./PostTemplate1080x1350";

interface Props {
  brand: BrandSettings;
  content: PostContentData;
  scale?: number;
  onContentChange?: (field: keyof PostContentData, value: string) => void;
}

function renderHighlightedText(
  text: string,
  accentColor: string,
  highlightColor: string = "#CC2222"
): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <span key={i} style={{ color: highlightColor }}>{part.slice(2, -2)}</span>;
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return <span key={i} style={{ color: accentColor }}>{part.slice(1, -1)}</span>;
    }
    return <span key={i}>{part}</span>;
  });
}

const StoryTemplate1080x1920 = forwardRef<HTMLDivElement, Props>(
  ({ brand, content, scale = 0.25, onContentChange }, ref) => {
    const isDark = brand.visual_style === "dark" || brand.visual_style === "bold";
    const textColor = isDark ? "#FFFFFF" : brand.text_color;

    const backgrounds: Record<string, React.CSSProperties> = {
      clean: { background: brand.background_color },
      bold: { background: `linear-gradient(135deg, ${brand.primary_color}, ${brand.secondary_color})` },
      dark: { background: `linear-gradient(180deg, ${brand.secondary_color} 0%, #0a0f1a 60%, ${brand.secondary_color} 100%)` },
      minimal: { background: brand.background_color },
    };

    const bgStyle = backgrounds[brand.visual_style] || backgrounds.dark;

    return (
      <div
        ref={ref}
        style={{
          width: 1080,
          height: 1920,
          ...bgStyle,
          display: "flex",
          flexDirection: "column",
          position: "relative",
          overflow: "hidden",
          fontFamily: brand.body_font,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      >
        {/* Background image */}
        {content.imageUrl && (
          <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", zIndex: 0 }}>
            <img
              src={content.imageUrl}
              alt=""
              crossOrigin="anonymous"
              style={{
                width: "100%", height: "100%", objectFit: "cover",
                opacity: isDark ? 0.25 : 0.35,
              }}
            />
            <div style={{
              position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
              background: isDark
                ? "linear-gradient(180deg, rgba(11,25,41,0.5) 0%, rgba(11,25,41,0.3) 30%, rgba(11,25,41,0.85) 70%, rgba(11,25,41,0.98) 100%)"
                : "linear-gradient(180deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.7) 100%)",
            }} />
          </div>
        )}

        {/* Dark style ambient glows */}
        {brand.visual_style === "dark" && (
          <>
            <div style={{
              position: "absolute", top: "10%", right: "-5%",
              width: 400, height: 400, borderRadius: "50%",
              background: `radial-gradient(circle, ${brand.primary_color}18, transparent 70%)`,
            }} />
            <div style={{
              position: "absolute", bottom: "20%", left: "-10%",
              width: 500, height: 500, borderRadius: "50%",
              background: `radial-gradient(circle, ${brand.accent_color}10, transparent 70%)`,
            }} />
          </>
        )}

        {/* Bold style decorative circles */}
        {brand.visual_style === "bold" && (
          <>
            <div style={{
              position: "absolute", top: -80, right: -80,
              width: 350, height: 350, borderRadius: "50%",
              background: brand.accent_color, opacity: 0.15,
            }} />
            <div style={{
              position: "absolute", bottom: 200, left: -60,
              width: 300, height: 300, borderRadius: "50%",
              background: brand.accent_color, opacity: 0.1,
            }} />
          </>
        )}

        {/* Clean style side bar */}
        {brand.visual_style === "clean" && (
          <div style={{
            position: "absolute", top: 0, left: 0,
            width: 8, height: "100%",
            background: brand.primary_color,
          }} />
        )}

        {/* Top section: Logo */}
        <div style={{ padding: "72px 72px 0", position: "relative", zIndex: 1 }}>
          {content.logoUrl && (
            <img
              src={content.logoUrl}
              alt="Logo"
              style={{ height: 64, objectFit: "contain" }}
              crossOrigin="anonymous"
            />
          )}
        </div>

        {/* Center content */}
        <div style={{
          flex: 1, display: "flex", flexDirection: "column",
          justifyContent: "center", padding: "0 72px",
          position: "relative", zIndex: 1,
        }}>
          {/* Headline */}
          <h1
            style={{
              fontFamily: brand.heading_font,
              fontSize: content.headline.length > 80 ? 56 : content.headline.length > 40 ? 72 : 88,
              fontWeight: 800,
              lineHeight: 1.05,
              color: textColor,
              marginBottom: 36,
              letterSpacing: brand.heading_font.includes("Bebas") ? "0.03em" : "-0.02em",
              textTransform: brand.heading_font.includes("Bebas") ? "uppercase" : "none",
              cursor: onContentChange ? "text" : "default",
              outline: "none",
            }}
            contentEditable={!!onContentChange}
            suppressContentEditableWarning
            onBlur={e => onContentChange?.("headline", e.currentTarget.textContent || "")}
          >
            {onContentChange ? content.headline : renderHighlightedText(content.headline, brand.accent_color)}
          </h1>

          {/* Subheadline */}
          {content.subheadline && (
            <p
              style={{
                fontSize: 34, fontWeight: 500, color: textColor, opacity: 0.85,
                lineHeight: 1.4, marginBottom: 40,
                cursor: onContentChange ? "text" : "default", outline: "none",
              }}
              contentEditable={!!onContentChange}
              suppressContentEditableWarning
              onBlur={e => onContentChange?.("subheadline", e.currentTarget.textContent || "")}
            >
              {onContentChange ? content.subheadline : renderHighlightedText(content.subheadline, brand.accent_color)}
            </p>
          )}

          {/* Body */}
          {content.body && (
            <p
              style={{
                fontSize: 28, color: textColor, opacity: 0.6, lineHeight: 1.6, maxWidth: "90%",
                cursor: onContentChange ? "text" : "default", outline: "none",
              }}
              contentEditable={!!onContentChange}
              suppressContentEditableWarning
              onBlur={e => onContentChange?.("body", e.currentTarget.textContent || "")}
            >
              {content.body}
            </p>
          )}
        </div>

        {/* Swipe up / CTA area */}
        {content.cta && (
          <div style={{
            position: "absolute",
            bottom: 0, left: 0, right: 0,
            zIndex: 2,
            background: brand.primary_color,
            padding: "32px 72px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}>
            <span
              style={{
                color: "#FFFFFF", fontSize: 32, fontWeight: 700,
                fontFamily: brand.heading_font, letterSpacing: "0.04em", textTransform: "uppercase",
                cursor: onContentChange ? "text" : "default", outline: "none",
              }}
              contentEditable={!!onContentChange}
              suppressContentEditableWarning
              onBlur={e => onContentChange?.("cta", e.currentTarget.textContent || "")}
            >
              {content.cta}
            </span>
          </div>
        )}

        {/* Footer */}
        {content.footer && !content.cta && (
          <div style={{
            padding: "0 72px 80px",
            position: "relative", zIndex: 1,
            textAlign: "center",
          }}>
            <span style={{
              fontSize: 24,
              color: textColor,
              opacity: 0.4,
              fontFamily: brand.body_font,
            }}>
              {content.footer}
            </span>
          </div>
        )}

        {/* Minimal bottom accent */}
        {brand.visual_style === "minimal" && (
          <div style={{
            position: "absolute", bottom: 0, left: 0,
            width: "100%", height: 6,
            background: brand.primary_color,
          }} />
        )}
      </div>
    );
  }
);

StoryTemplate1080x1920.displayName = "StoryTemplate1080x1920";

export default StoryTemplate1080x1920;
