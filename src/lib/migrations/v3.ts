import { migrateV1Data } from "./v2";
import type { LegacyArchive } from "../types";
export function migrateV2Data(data: Record<string, unknown>, archive: LegacyArchive): Record<string, unknown> {
  const next = migrateV1Data(data, archive);
  // Keep preferences from the first Path edition while retiring its seed IDs.
  next.settings = { ...(next.settings as object), ...(data.settings as object ?? {}) };
  next.schemaVersion = 3;
  return next;
}
