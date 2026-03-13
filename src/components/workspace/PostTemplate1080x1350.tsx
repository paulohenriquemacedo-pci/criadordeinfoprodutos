import { forwardRef } from "react";
import { BrandSettings } from "@/hooks/useBrandSettings";

interface PostContentData {
  headline: string;
  subheadline?: string;
  body?: string;
  cta?: string;
  footer?: string;
  logoUrl?: string;
  imageUrl?: string;
  highlightWords?: string[];
}

interface Props {
  brand: BrandSettings;
  content: PostContentData;
  scale?: number;
}

function renderHighlightedText(
  text: string,
  accentColor: string,
  highlightColor: string = "#CC2222"
): React.ReactNode[] {
  // Match text wrapped in *word* (yellow) or **word** (red)
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <span key={i} style={{ color: highlightColor }}>
          {part.slice(2, -2)}
        </span>
      );
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return (
        <span key={i} style={{ color: accentColor }}>
          {part.slice(1, -1)}
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

const PostTemplate1080x1350 = forwardRef<HTMLDivElement, Props>(
  ({ brand, content, scale = 0.3 }, ref) => {
    const isDark = brand.visual_style === "dark" || brand.visual_style === "bold";

    const backgrounds: Record<string, React.CSSProperties> = {
      clean: { background: brand.background_color },
      bold: { background: `linear-gradient(135deg, ${brand.primary_color}, ${brand.secondary_color})` },
      dark: { background: `linear-gradient(180deg, ${brand.secondary_color}, #0a0f1a)` },
      minimal: { background: brand.background_color },
    };

    const textColor = isDark ? "#FFFFFF" : brand.text_color;
    const bgStyle = backgrounds[brand.visual_style] || backgrounds.dark;

    return (
      <div
        ref={ref}
        style={{
          width: 1080,
          height: 1350,
          ...bgStyle,
          display: "flex",
          flexDirection: "column",
          padding: "64px 72px",
          position: "relative",
          overflow: "hidden",
          fontFamily: brand.body_font,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      >
        {/* Subtle gradient overlay for dark style */}
        {brand.visual_style === "dark" && (
          <>
            <div style={{
              position: "absolute", top: 0, right: 0,
              width: "60%", height: "100%",
              background: `linear-gradient(200deg, ${brand.primary_color}12, transparent 60%)`,
            }} />
            <div style={{
              position: "absolute", bottom: 0, left: 0,
              width: "100%", height: "40%",
              background: `linear-gradient(to top, ${brand.primary_color}08, transparent)`,
            }} />
          </>
        )}

        {brand.visual_style === "bold" && (
          <>
            <div style={{
              position: "absolute", top: -60, right: -60,
              width: 300, height: 300, borderRadius: "50%",
              background: brand.accent_color, opacity: 0.15,
            }} />
            <div style={{
              position: "absolute", bottom: -80, left: -40,
              width: 400, height: 400, borderRadius: "50%",
              background: brand.accent_color, opacity: 0.1,
            }} />
          </>
        )}

        {brand.visual_style === "clean" && (
          <div style={{
            position: "absolute", top: 0, left: 0,
            width: 8, height: "100%",
            background: brand.primary_color,
          }} />
        )}

        {/* Logo area */}
        {content.logoUrl && (
          <div style={{ marginBottom: 32, position: "relative", zIndex: 1 }}>
            <img
              src={content.logoUrl}
              alt="Logo"
              style={{ height: 56, objectFit: "contain" }}
              crossOrigin="anonymous"
            />
          </div>
        )}

        {/* Static image */}
        {content.imageUrl && (
          <div style={{
            position: "absolute", top: 0, left: 0, width: "100%", height: "100%", zIndex: 0,
          }}>
            <img
              src={content.imageUrl}
              alt=""
              crossOrigin="anonymous"
              style={{
                width: "100%", height: "100%", objectFit: "cover",
                opacity: brand.visual_style === "dark" ? 0.25 : 0.35,
              }}
            />
            <div style={{
              position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
              background: brand.visual_style === "dark"
                ? "linear-gradient(180deg, rgba(11,25,41,0.6) 0%, rgba(11,25,41,0.95) 100%)"
                : "linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.5) 100%)",
            }} />
          </div>
        )}

        {/* Content area */}
        <div style={{
          flex: 1, display: "flex", flexDirection: "column",
          justifyContent: "center", position: "relative", zIndex: 1,
        }}>
          {/* Headline with highlight support */}
          <h1 style={{
            fontFamily: brand.heading_font,
            fontSize: content.headline.length > 60 ? 54 : content.headline.length > 30 ? 66 : 80,
            fontWeight: 800,
            lineHeight: 1.05,
            color: textColor,
            marginBottom: 28,
            letterSpacing: brand.heading_font.includes("Bebas") ? "0.03em" : "-0.02em",
            textTransform: brand.heading_font.includes("Bebas") ? "uppercase" : "none",
          }}>
            {renderHighlightedText(content.headline, brand.accent_color)}
          </h1>

          {/* Subheadline */}
          {content.subheadline && (
            <p style={{
              fontSize: 30,
              fontWeight: 500,
              color: textColor,
              opacity: 0.85,
              lineHeight: 1.4,
              marginBottom: 32,
            }}>
              {renderHighlightedText(content.subheadline, brand.accent_color)}
            </p>
          )}

          {/* Body */}
          {content.body && (
            <p style={{
              fontSize: 24,
              color: textColor,
              opacity: 0.65,
              lineHeight: 1.6,
              maxWidth: "90%",
            }}>
              {content.body}
            </p>
          )}
        </div>

        {/* CTA bar — orange bar at bottom like @sistema.academia */}
        {content.cta && (
          <div style={{
            position: "absolute",
            bottom: 0, left: 0, right: 0,
            zIndex: 2,
            background: brand.primary_color,
            padding: "28px 72px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <span style={{
              color: "#FFFFFF",
              fontSize: 30,
              fontWeight: 700,
              fontFamily: brand.heading_font,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}>
              {content.cta}
            </span>
          </div>
        )}

        {/* Footer text */}
        {content.footer && !content.cta && (
          <div style={{
            position: "relative", zIndex: 1, marginTop: 24,
            fontSize: 20,
            color: textColor,
            opacity: 0.4,
            fontFamily: brand.body_font,
          }}>
            {content.footer}
          </div>
        )}

        {/* Bottom accent line for minimal */}
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

PostTemplate1080x1350.displayName = "PostTemplate1080x1350";

export default PostTemplate1080x1350;
export type { PostContentData };
