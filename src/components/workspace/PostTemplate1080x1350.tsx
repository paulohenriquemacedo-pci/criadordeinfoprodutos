import { forwardRef } from "react";
import { BrandSettings } from "@/hooks/useBrandSettings";

interface PostContentData {
  headline: string;
  subheadline?: string;
  body?: string;
  cta?: string;
  footer?: string;
  logoUrl?: string;
}

interface Props {
  brand: BrandSettings;
  content: PostContentData;
  scale?: number;
}

const PostTemplate1080x1350 = forwardRef<HTMLDivElement, Props>(
  ({ brand, content, scale = 0.3 }, ref) => {
    const styleMap: Record<string, React.CSSProperties> = {
      clean: {
        background: brand.background_color,
        justifyContent: "center",
      },
      bold: {
        background: `linear-gradient(135deg, ${brand.primary_color}, ${brand.secondary_color})`,
        justifyContent: "center",
      },
      dark: {
        background: `linear-gradient(180deg, #0f0f0f, #1a1a2e)`,
        justifyContent: "center",
      },
      minimal: {
        background: brand.background_color,
        justifyContent: "center",
      },
    };

    const textColorMap: Record<string, string> = {
      clean: brand.text_color,
      bold: "#ffffff",
      dark: "#f0f0f0",
      minimal: brand.text_color,
    };

    const style = styleMap[brand.visual_style] || styleMap.clean;
    const textColor = textColorMap[brand.visual_style] || brand.text_color;

    const isDark = brand.visual_style === "dark" || brand.visual_style === "bold";

    return (
      <div
        ref={ref}
        style={{
          width: 1080,
          height: 1350,
          ...style,
          display: "flex",
          flexDirection: "column",
          padding: "80px 72px",
          position: "relative",
          overflow: "hidden",
          fontFamily: brand.body_font,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      >
        {/* Decorative elements based on style */}
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

        {brand.visual_style === "dark" && (
          <div style={{
            position: "absolute", top: 0, right: 0,
            width: "50%", height: "100%",
            background: `linear-gradient(180deg, ${brand.primary_color}15, transparent)`,
          }} />
        )}

        {brand.visual_style === "clean" && (
          <div style={{
            position: "absolute", top: 0, left: 0,
            width: 8, height: "100%",
            background: brand.primary_color,
          }} />
        )}

        {/* Logo */}
        {content.logoUrl && (
          <div style={{ marginBottom: 40, position: "relative", zIndex: 1 }}>
            <img
              src={content.logoUrl}
              alt="Logo"
              style={{ height: 48, objectFit: "contain" }}
              crossOrigin="anonymous"
            />
          </div>
        )}

        {/* Content area */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", position: "relative", zIndex: 1 }}>
          {/* Headline */}
          <h1 style={{
            fontFamily: brand.heading_font,
            fontSize: content.headline.length > 60 ? 56 : content.headline.length > 30 ? 68 : 80,
            fontWeight: 800,
            lineHeight: 1.1,
            color: isDark ? "#ffffff" : brand.primary_color,
            marginBottom: 24,
            letterSpacing: "-0.02em",
          }}>
            {content.headline}
          </h1>

          {/* Subheadline */}
          {content.subheadline && (
            <p style={{
              fontSize: 32,
              fontWeight: 500,
              color: textColor,
              opacity: 0.85,
              lineHeight: 1.4,
              marginBottom: 32,
            }}>
              {content.subheadline}
            </p>
          )}

          {/* Body */}
          {content.body && (
            <p style={{
              fontSize: 26,
              color: textColor,
              opacity: 0.7,
              lineHeight: 1.6,
              maxWidth: "90%",
            }}>
              {content.body}
            </p>
          )}
        </div>

        {/* CTA */}
        {content.cta && (
          <div style={{ position: "relative", zIndex: 1, marginTop: 40 }}>
            <div style={{
              display: "inline-flex",
              padding: "20px 48px",
              borderRadius: brand.visual_style === "minimal" ? 0 : 12,
              background: isDark ? brand.accent_color : brand.primary_color,
              color: "#ffffff",
              fontSize: 28,
              fontWeight: 700,
              fontFamily: brand.heading_font,
              letterSpacing: "0.02em",
            }}>
              {content.cta}
            </div>
          </div>
        )}

        {/* Footer */}
        {content.footer && (
          <div style={{
            position: "relative", zIndex: 1, marginTop: 24,
            fontSize: 20,
            color: textColor,
            opacity: 0.5,
            fontFamily: brand.body_font,
          }}>
            {content.footer}
          </div>
        )}

        {/* Bottom accent bar */}
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
