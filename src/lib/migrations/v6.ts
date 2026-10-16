import { emptyLearningState, validateLearningState } from "../legacy-learning";
export function migrateV5Data(data: Record<string, unknown>): Record<string, unknown> {
  const learning = data.learning ?? emptyLearningState();
  validateLearningState(learning);
  return { ...data, learning, schemaVersion: 6 };
}
