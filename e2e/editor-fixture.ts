import type { Page } from "@playwright/test";

export async function writeCode(page: Page, code: string) {
  await page.locator(".monaco-editor").waitFor();
  await page.evaluate(value => new Promise<void>(resolve => {
    const amd = (window as unknown as { require: (names: string[], callback: (m: { editor: { getModels: () => { setValue: (v: string) => void }[] } }) => void) => void }).require;
    amd(["vs/editor/editor.main"], monaco => { monaco.editor.getModels()[0].setValue(value); resolve(); });
  }), code);
}
