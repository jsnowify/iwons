"use client";
import Editor, { loader, type OnMount } from "@monaco-editor/react";
import { memo, useRef, useEffect } from "react";
import type { editor } from "monaco-editor";
import { useStore } from "@/store/use-store";
import type { Language } from "@/lib/types";
import { EditorSkeleton } from "./ui";
loader.config({ paths: { vs: "/monaco/vs" } });
function CodeEditor({
  code,
  onChange,
  language,
  onBurst,
}: {
  code: string;
  onChange: (s: string) => void;
  language: Language;
  onBurst: () => void;
}) {
  const settings = useStore((s) => s.settings);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Parameters<OnMount>[1] | null>(null);
  const burst = useRef(onBurst);
  burst.current = onBurst;
  function theme() {
    if (!monacoRef.current) return;
    const css = getComputedStyle(document.documentElement);
    monacoRef.current.editor.defineTheme("iwons", {
      base: settings.theme === "dark" ? "vs-dark" : "vs",
      inherit: true,
      rules: [
        {
          token: "comment",
          foreground: css
            .getPropertyValue("--code-comment")
            .trim()
            .replace("#", ""),
        },
      ],
      colors: {
        "editor.background": css.getPropertyValue("--surface").trim(),
        "editor.foreground": css.getPropertyValue("--text").trim(),
        "editorLineNumber.foreground": css.getPropertyValue("--muted").trim(),
        "editorCursor.foreground": css.getPropertyValue("--accent").trim(),
        "scrollbarSlider.background": css.getPropertyValue("--muted").trim(),
        "scrollbarSlider.hoverBackground": css.getPropertyValue("--ink").trim(),
        "scrollbarSlider.activeBackground": css.getPropertyValue("--accent").trim(),
      },
    });
    monacoRef.current.editor.setTheme("iwons");
  }
  useEffect(() => {
    const frame = requestAnimationFrame(theme);
    return () => cancelAnimationFrame(frame);
  }, [settings.theme]);
  const mount: OnMount = (instance, monaco) => {
    editorRef.current = instance;
    monacoRef.current = monaco;
    theme();
    let windowStart = Date.now(),
      inserted = 0;
    const change = instance.onDidChangeModelContent((e) => {
      const n = Date.now();
      if (n - windowStart > 1000) {
        windowStart = n;
        inserted = 0;
      }
      if (!e.isFlush) {
        inserted += e.changes.reduce((sum, c) => sum + c.text.length, 0);
        if (inserted > 200) {
          burst.current();
          inserted = 0;
        }
      }
    });
    instance.onDidDispose(() => change.dispose());
  };
  return (
    <Editor
      value={code}
      language={language}
      onChange={(v) => onChange(v ?? "")}
      onMount={mount}
      loading={<EditorSkeleton />}
      options={{
        fontSize: settings.fontSize,
        tabSize: settings.tabSize,
        fontFamily: "var(--font-jetbrains), monospace",
        minimap: { enabled: false },
        padding: { top: 20, bottom: 20 },
        lineNumbersMinChars: 3,
        scrollBeyondLastLine: false,
        automaticLayout: true,
        wordWrap: "on",
        renderLineHighlight: "none",
        overviewRulerLanes: 0,
        hideCursorInOverviewRuler: true,
        contextmenu: true,
        accessibilitySupport: "on",
        ariaLabel: `${language} solution editor`,
        fixedOverflowWidgets: true,
      }}
    />
  );
}
export default memo(CodeEditor);
