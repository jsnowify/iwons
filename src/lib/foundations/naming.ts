/** Check learner-facing prose, never internal IDs or source code. */
export function courseNamingErrors(text: string): string[] {
  const errors: string[] = [];
  if (/\bCP[12]\b/i.test(text)) errors.push("Use the full Computer Programming course name.");
  const abbreviation = text.search(/\bDSA\b/);
  if (abbreviation >= 0 && !text.slice(0, abbreviation).includes("Data Structures and Algorithms")) {
    errors.push("Write Data Structures and Algorithms before using its abbreviation.");
  }
  return errors;
}
