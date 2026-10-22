import "server-only";
import { isDeepStrictEqual } from "node:util";
import { MongoServerError, type CollationOptions, type Db, type Document, type IndexDescriptionInfo } from "mongodb";

export const CREDENTIAL_COLLATION = Object.freeze({ locale: "en", strength: 2 });
interface UniqueIndex {
  name: string; key: Record<string, 1>; partial: Document; collation: CollationOptions;
}
const indexes: UniqueIndex[] = [
  { name: "users_username_unique_v1", key: { username: 1 }, partial: { username: { $type: "string" } }, collation: CREDENTIAL_COLLATION },
  { name: "users_email_unique_v1", key: { email: 1 }, partial: { email: { $type: "string" } }, collation: CREDENTIAL_COLLATION },
  { name: "users_provider_subject_unique_v2", key: { provider: 1, subject: 1 },
    partial: { provider: { $type: "string" }, subject: { $type: "string" } }, collation: { locale: "simple" } },
];
export class CredentialIndexError extends Error {
  constructor(message: string) { super(message); this.name = "CredentialIndexError"; }
}
function sameCollation(actual: Document | undefined, expected: CollationOptions) {
  if (expected.locale === "simple") return !actual || actual.locale === "simple";
  return actual?.locale === expected.locale && actual.strength === expected.strength &&
    !actual.caseLevel && !actual.numericOrdering && actual.alternate === "non-ignorable";
}
function matches(actual: IndexDescriptionInfo, expected: UniqueIndex) {
  return isDeepStrictEqual(actual.key, expected.key) && actual.unique === true &&
    isDeepStrictEqual(actual.partialFilterExpression, expected.partial) && sameCollation(actual.collation, expected.collation);
}
async function currentIndexes(db: Db) {
  try { return await db.collection("users").listIndexes().toArray(); }
  catch (error) {
    if (error instanceof MongoServerError && error.code === 26) return [];
    throw error;
  }
}
export async function requireCredentialUserIndexes(db: Db) {
  const existing = await currentIndexes(db);
  const ready = indexes.every(spec => existing.some(index => matches(index, spec)));
  const blocking = existing.some(index => isDeepStrictEqual(index.key, { provider: 1, subject: 1 }) &&
    index.unique === true && !index.sparse && !index.partialFilterExpression);
  if (!ready || blocking)
    throw new CredentialIndexError("Account indexes are not ready. Run the account index migration before accepting signups.");
}
async function duplicateGroups(db: Db, spec: UniqueIndex) {
  const row = await db.collection("users").aggregate<{ groups: number }>([
    { $match: spec.partial },
    { $group: { _id: Object.fromEntries(Object.keys(spec.key).map(key => [key, `$${key}`])), count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } }, { $count: "groups" },
  ], { collation: spec.collation }).next();
  return row?.groups ?? 0;
}
export async function inspectCredentialUserIndexes(db: Db) {
  const existing = await currentIndexes(db);
  for (const spec of indexes) {
    const named = existing.find(index => index.name === spec.name);
    if (named && !matches(named, spec))
      throw new CredentialIndexError(`Index configuration differs for ${spec.name}. No records were changed.`);
  }
  // Build the replacement first. Only the old non-sparse unique OAuth index
  // blocks multiple credential users that have neither provider nor subject.
  const retired = existing.filter(index => isDeepStrictEqual(index.key, { provider: 1, subject: 1 }) &&
    index.unique === true && !index.sparse && !index.partialFilterExpression);
  if (retired.some(index => !sameCollation(index.collation, { locale: "simple" })))
    throw new CredentialIndexError("The legacy provider index needs a separate migration. No records were changed.");
  const counts = await Promise.all(indexes.map(spec => duplicateGroups(db, spec)));
  return {
    users: await db.collection("users").countDocuments(),
    create: indexes.filter(spec => !existing.some(index => matches(index, spec))).map(spec => spec.name),
    retire: retired.map(index => index.name),
    conflicts: { username: counts[0], email: counts[1], provider: counts[2] },
  };
}
export async function createCredentialUserIndexes(db: Db) {
  const plan = await inspectCredentialUserIndexes(db);
  if (Object.values(plan.conflicts).some(count => count > 0))
    throw new CredentialIndexError(`Duplicate groups need review: username=${plan.conflicts.username}, email=${plan.conflicts.email}, provider=${plan.conflicts.provider}. No records were changed.`);
  for (const spec of indexes) {
    if (!plan.create.includes(spec.name)) continue;
    try {
      await db.collection("users").createIndex(spec.key, { name: spec.name, unique: true,
        partialFilterExpression: spec.partial, collation: spec.collation });
    } catch {
      // MongoDB remains authoritative if another writer races the preflight.
      // Do not expose duplicate values from the driver's error message.
      throw new CredentialIndexError(`Could not create ${spec.name}. Check index configuration and duplicate groups. No records were changed.`);
    }
  }
  for (const name of plan.retire) {
    try { await db.collection("users").dropIndex(name); }
    catch (error) {
      if (!(error instanceof MongoServerError) || error.code !== 27) throw error;
    }
  }
  return inspectCredentialUserIndexes(db);
}
