"use client";

import { NodeViewWrapper, NodeViewProps } from "@tiptap/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Box, IconButton, Tooltip, Paper } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import FormatAlignLeftIcon from "@mui/icons-material/FormatAlignLeft";
import FormatAlignCenterIcon from "@mui/icons-material/FormatAlignCenter";
import FormatAlignRightIcon from "@mui/icons-material/FormatAlignRight";

type Align = "left" | "center" | "right";

export default function ResizableImage({ node, updateAttributes, selected }: NodeViewProps) {
  const theme = useTheme();
  const { src, alt, width, align } = node.attrs as {
    src: string; alt?: string; width?: number; align?: Align;
  };

  const [isResizing, setIsResizing] = useState(false);
  const startX = useRef(0);
  const startWidth = useRef(0);
  const currentAlign: Align = align ?? "center";
  const currentWidth: number = width ?? 400;

  const onMouseDownResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    startX.current = e.clientX;
    startWidth.current = currentWidth;
  }, [currentWidth]);

  useEffect(() => {
    if (!isResizing) return;
    const onMouseMove = (e: MouseEvent) => {
      const delta = e.clientX - startX.current;
      const newWidth = Math.max(80, Math.min(startWidth.current + delta, 1200));
      updateAttributes({ width: newWidth });
    };
    const onMouseUp = () => setIsResizing(false);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [isResizing, updateAttributes]);

  const justifyMap: Record<Align, string> = {
    left: "flex-start",
    center: "center",
    right: "flex-end",
  };

  const isDark = theme.palette.mode === "dark";

  return (
    <NodeViewWrapper>
      <Box sx={{ display: "flex", justifyContent: justifyMap[currentAlign], my: 1.5, position: "relative" }}>
        <Box sx={{ position: "relative", display: "inline-block", width: currentWidth, maxWidth: "100%" }}>

          {/* Floating toolbar — shown when selected */}
          {selected && (
            <Paper
              elevation={3}
              sx={{
                position: "absolute",
                top: 8,
                left: "50%",
                transform: "translateX(-50%)",
                zIndex: 10,
                display: "flex",
                alignItems: "center",
                gap: 0.25,
                px: 0.75,
                py: 0.5,
                borderRadius: 1.5,
                border: `1px solid ${theme.palette.divider}`,
                bgcolor: isDark ? "#1e1e1e" : "#ffffff",
                whiteSpace: "nowrap",
              }}
            >
              {(["left", "center", "right"] as Align[]).map(a => {
                const Icon = a === "left" ? FormatAlignLeftIcon : a === "center" ? FormatAlignCenterIcon : FormatAlignRightIcon;
                const label = a === "left" ? "По левому краю" : a === "center" ? "По центру" : "По правому краю";
                const isActive = currentAlign === a;
                return (
                  <Tooltip key={a} title={label} placement="top">
                    <IconButton
                      size="small"
                      onMouseDown={e => { e.preventDefault(); e.stopPropagation(); updateAttributes({ align: a }); }}
                      sx={{
                        width: 26, height: 26, borderRadius: 1,
                        bgcolor: isActive ? "text.primary" : "transparent",
                        color: isActive ? (isDark ? "#0d0d0d" : "#ffffff") : "text.secondary",
                        "&:hover": { bgcolor: isActive ? "text.primary" : "action.hover" },
                      }}
                    >
                      <Icon sx={{ fontSize: 14 }} />
                    </IconButton>
                  </Tooltip>
                );
              })}
              <Box sx={{ width: "1px", height: 16, bgcolor: "divider", mx: 0.5 }} />
              <Box sx={{ fontSize: 11, color: "text.secondary", px: 0.5, fontVariantNumeric: "tabular-nums" }}>
                {currentWidth}px
              </Box>
            </Paper>
          )}

          {/* Image */}
          <Box
            component="img"
            src={src}
            alt={alt ?? ""}
            draggable={false}
            sx={{
              display: "block",
              width: "100%",
              height: "auto",
              borderRadius: 1,
              outline: selected ? `2px solid ${theme.palette.primary.main}` : "none",
              outlineOffset: 2,
            }}
          />

          {/* Resize handle */}
          <Box
            onMouseDown={onMouseDownResize}
            sx={{
              position: "absolute",
              right: -6,
              top: "50%",
              transform: "translateY(-50%)",
              width: 12,
              height: 32,
              borderRadius: 6,
              bgcolor: "primary.main",
              opacity: selected || isResizing ? 0.85 : 0,
              cursor: "ew-resize",
              transition: "opacity 0.15s",
              "&:hover": { opacity: 1 },
              zIndex: 5,
            }}
          />
        </Box>
      </Box>
    </NodeViewWrapper>
  );
}
