self.onmessage = async ({ data: req }) => {
  try {
    const { loadPyodide } =
      await import("https://cdn.jsdelivr.net/pyodide/v314.0.7/full/pyodide.mjs");
    const py = await loadPyodide({
      indexURL: "https://cdn.jsdelivr.net/pyodide/v314.0.7/full/",
    });
    const response = await fetch("/runners/harness.py");
    if (!response.ok) throw new Error("Python harness could not load.");
    const harness = await response.text();
    py.globals.set("iwons_request", JSON.stringify(req));
    self.postMessage({ status: "ready" });
    const raw = await py.runPythonAsync(harness);
    self.postMessage(JSON.parse(raw));
  } catch (error) {
    self.postMessage({
      verdict: "runtime_error",
      cases: [],
      compileError: { message: String(error) },
    });
  }
};
