"use client";

import { NodeViewWrapper, NodeViewProps } from "@tiptap/react";
import { useEffect, useRef } from "react";
import katex from "katex";

export default function MathNodeView({ node, selected }: NodeViewProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const latex: string = node.attrs.latex ?? "";

  useEffect(() => {
    if (!ref.current) return;
    try {
      katex.render(latex || "\\square", ref.current, {
        throwOnError: false,
        displayMode: node.attrs.display === true,
      });
    } catch {
      if (ref.current) ref.current.textContent = latex;
    }
  }, [latex, node.attrs.display]);

  const Tag = node.attrs.display ? "div" : "span";

  return (
    <NodeViewWrapper
      as={Tag}
      className={[
        "math-node",
        node.attrs.display ? "block text-center my-3" : "inline mx-0.5",
        selected ? "ring-2 ring-primary ring-offset-1 rounded" : "",
      ].join(" ")}
    >
      <span ref={ref} />
    </NodeViewWrapper>
  );
}
