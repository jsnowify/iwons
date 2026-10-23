import "server-only";
import { createHash, randomBytes } from "node:crypto";
import type { Db } from "mongodb";
import { JudgeError } from "../judge0/errors";
import type { JudgeLanguage } from "../judge0/contracts";
import type { ServerProblem } from "./judge-repository";
import { ROOM_LIMITS, type CustomProblemInput } from "../rooms/contracts";
import { CATALOG_LANGUAGES, catalogCases, catalogEligible, catalogExamples, catalogTestsHash, loadCatalogProblem, wrapCatalog, type CatalogLanguage } from "../rooms/catalog";
import { cleanBlock, cleanText } from "../text";
import { effectiveStatus, hasStarted, isDuplicate, type CustomProblemDoc, type MemberDoc, type RoomDoc, type RoomProblemDoc } from "./rooms";

export const catalogRefKey = (problemId: string) => `c-${problemId}`;
export const customRefKey = (customId: string) => `u-${customId}`;
const newCustomId = () => randomBytes(10).toString("hex");
export const testsDigest = (cases: { input: string; expectedOutput: string; isHidden: boolean }[]) =>
  createHash("sha256").update(JSON.stringify(cases.map(item => [item.input, item.expectedOutput, item.isHidden]))).digest("hex").slice(0, 32);
const toCases = (cases: CustomProblemInput["testCases"]) => cases.map((item, order) => ({ input: item.input, expectedOutput: item.expectedOutput, isHidden: item.isHidden, order: order + 1 }));

export async function listRoomProblems(db: Db, roomId: string) {
  return db.collection<RoomProblemDoc>("room_problems").find({ roomId }).sort({ order: 1 }).limit(ROOM_LIMITS.maxProblems).toArray();
}

/** Reserves a slot (atomic cap) and inserts the problem; a duplicate frees the slot again. */
async function attach(db: Db, room: RoomDoc, entry: Omit<RoomProblemDoc, "roomId" | "order" | "addedAt">, now: Date) {
  const rooms = db.collection<RoomDoc>("rooms");
  const before = await rooms.findOneAndUpdate({ _id: room._id, status: "active", problemCount: { $lt: ROOM_LIMITS.maxProblems } },
    { $inc: { problemCount: 1, nextOrder: 1 }, $set: { updatedAt: now } });
  if (!before) throw new JudgeError(409, `A room can hold at most ${ROOM_LIMITS.maxProblems} problems.`);
  try {
    const doc: RoomProblemDoc = { ...entry, roomId: room._id, order: before.nextOrder, addedAt: now };
    await db.collection<RoomProblemDoc>("room_problems").insertOne(doc);
    return doc;
  } catch (error) {
    await rooms.updateOne({ _id: room._id, problemCount: { $gt: 0 } }, { $inc: { problemCount: -1 } });
    if (isDuplicate(error)) throw new JudgeError(409, "That problem is already in this room.");
    throw error;
  }
}
export async function addCatalogProblem(db: Db, room: RoomDoc, problemId: string, now: Date) {
  const problem = loadCatalogProblem(problemId);
  if (!catalogEligible(problem)) throw new JudgeError(400, "That problem can't be judged on the server yet. Pick another, or write a custom problem.");
  return attach(db, room, { problemRef: { source: "catalog", problemId }, refKey: catalogRefKey(problemId), title: problem.title, difficulty: problem.difficulty }, now);
}
export async function addCustomProblem(db: Db, room: RoomDoc, customProblemId: string, now: Date) {
  const custom = await db.collection<CustomProblemDoc>("custom_problems").findOne({ _id: customProblemId, roomId: room._id });
  if (!custom) throw new JudgeError(404, "That custom problem was not found in this room.");
  if (!custom.validated) throw new JudgeError(409, "Validate the problem with a reference solution before adding it.");
  return attach(db, room, { problemRef: { source: "custom", customProblemId }, refKey: customRefKey(customProblemId), title: custom.title, difficulty: custom.difficulty }, now);
}
export async function removeProblem(db: Db, room: RoomDoc, refKey: string) {
  const removed = await db.collection<RoomProblemDoc>("room_problems").deleteOne({ roomId: room._id, refKey, locked: { $ne: true } });
  if (removed.deletedCount !== 1) {
    const exists = await db.collection<RoomProblemDoc>("room_problems").findOne({ roomId: room._id, refKey });
    throw exists ? new JudgeError(409, "Someone already submitted to this problem, so it can no longer be removed.") : new JudgeError(404, "That problem is not in this room.");
  }
  await db.collection<RoomDoc>("rooms").updateOne({ _id: room._id, problemCount: { $gt: 0 } }, { $inc: { problemCount: -1 } });
  return { removed: true };
}

export async function createCustomProblem(db: Db, room: RoomDoc, hostUserId: string, input: CustomProblemInput, now: Date) {
  const rooms = db.collection<RoomDoc>("rooms");
  const reserved = await rooms.findOneAndUpdate({ _id: room._id, status: "active", customCount: { $lt: ROOM_LIMITS.maxCustomProblems } }, { $inc: { customCount: 1 } });
  if (!reserved) throw new JudgeError(409, `A room can have at most ${ROOM_LIMITS.maxCustomProblems} custom problems.`);
  const testCases = toCases(input.testCases);
  const doc: CustomProblemDoc = { _id: newCustomId(), roomId: room._id, createdByUserId: hostUserId, title: input.title, statement: input.statement,
    difficulty: input.difficulty, starterCode: input.starterCode, testCases, testsHash: testsDigest(testCases), validated: false, testsLocked: false, createdAt: now, updatedAt: now };
  try { await db.collection<CustomProblemDoc>("custom_problems").insertOne(doc); }
  catch (error) { await rooms.updateOne({ _id: room._id, customCount: { $gt: 0 } }, { $inc: { customCount: -1 } }); throw error; }
  return doc;
}
export async function updateCustomProblem(db: Db, room: RoomDoc, id: string, patch: Partial<CustomProblemInput>, now: Date) {
  const collection = db.collection<CustomProblemDoc>("custom_problems");
  const current = await collection.findOne({ _id: id, roomId: room._id });
  if (!current) throw new JudgeError(404, "That custom problem was not found in this room.");
  const touchesTests = patch.testCases !== undefined || patch.starterCode !== undefined || patch.difficulty !== undefined;
  const set: Record<string, unknown> = { updatedAt: now };
  if (patch.title !== undefined) set.title = patch.title;
  if (patch.statement !== undefined) set.statement = patch.statement;
  const filter: Record<string, unknown> = { _id: id, roomId: room._id };
  if (touchesTests) {
    if (current.testsLocked) throw new JudgeError(409, "Members have already submitted, so only the title and statement can be edited now.");
    filter.testsLocked = false;
    if (patch.difficulty !== undefined) set.difficulty = patch.difficulty;
    if (patch.starterCode !== undefined) set.starterCode = patch.starterCode;
    if (patch.testCases !== undefined) {
      const testCases = toCases(patch.testCases);
      Object.assign(set, { testCases, testsHash: testsDigest(testCases), validated: false });
    }
  }
  const next = await collection.findOneAndUpdate(filter, { $set: set }, { returnDocument: "after" });
  if (!next) throw new JudgeError(409, "Members just submitted to this problem, so its tests are now locked. Reload to continue.");
  if (patch.title !== undefined) await db.collection<RoomProblemDoc>("room_problems").updateOne({ roomId: room._id, refKey: customRefKey(id) }, { $set: { title: next.title } });
  return next;
}
export const hostCustomProblems = (db: Db, roomId: string) => db.collection<CustomProblemDoc>("custom_problems").find({ roomId }).sort({ createdAt: 1 }).limit(ROOM_LIMITS.maxCustomProblems).toArray();
export async function hostCustomProblem(db: Db, roomId: string, id: string) {
  const doc = await db.collection<CustomProblemDoc>("custom_problems").findOne({ _id: id, roomId });
  if (!doc) throw new JudgeError(404, "That custom problem was not found in this room.");
  return doc;
}

const emptyStarters = { java: "", python: "", javascript: "" };
export interface JudgeableProblem extends ServerProblem {
  wrap?: (language: JudgeLanguage, code: string) => string; testsHash: string; languages: JudgeLanguage[];
}
function catalogJudgeable(problemId: string): JudgeableProblem {
  const problem = loadCatalogProblem(problemId);
  if (!catalogEligible(problem)) throw new JudgeError(404, "This problem is not available for server judging.");
  return { _id: catalogRefKey(problemId), slug: catalogRefKey(problemId), title: problem.title, published: true, format: "stdin", difficulty: problem.difficulty,
    description: problem.descriptionMd, starters: { ...emptyStarters, javascript: problem.starterCode.javascript, python: problem.starterCode.python },
    cases: catalogCases(problem), testsHash: catalogTestsHash(problem), languages: [...CATALOG_LANGUAGES],
    wrap: (language, code) => language === "java" ? code : wrapCatalog(language as CatalogLanguage, code, problem.functionName) };
}
/** The free judge accepts a limited number of cases per job; keep every example and spread the hidden checks. */
export function fitCases(problem: JudgeableProblem, maxCases?: number): JudgeableProblem {
  if (!maxCases || problem.cases.length <= maxCases) return problem;
  const visible = problem.cases.filter(item => !item.hidden), hidden = problem.cases.filter(item => item.hidden);
  const keepVisible = visible.slice(0, Math.max(1, maxCases - Math.min(hidden.length, Math.ceil(maxCases / 2))));
  const slots = Math.max(0, maxCases - keepVisible.length);
  const keepHidden = slots >= hidden.length ? hidden : Array.from({ length: slots }, (_, index) => hidden[Math.floor((index * hidden.length) / slots)]);
  return { ...problem, cases: [...keepVisible, ...keepHidden] };
}
function customJudgeable(custom: CustomProblemDoc): JudgeableProblem {
  return { _id: customRefKey(custom._id), slug: customRefKey(custom._id), title: custom.title, published: true, format: "stdin", difficulty: custom.difficulty,
    description: custom.statement, starters: custom.starterCode, testsHash: custom.testsHash, languages: ["java", "python", "javascript"],
    cases: [...custom.testCases].sort((a, b) => a.order - b.order).map(item => ({ id: `case-${item.order}`, stdin: item.input, expected: item.expectedOutput, hidden: item.isHidden })) };
}

/** Everything the judge needs for a room job, after checking membership, room state and problem ownership. */
export async function roomJudgeProblem(db: Db, input: { roomId: string; userId: string; refKey: string; language: JudgeLanguage; mode: "run" | "submit"; purpose?: "validate"; maxCases?: number }, now = new Date()) {
  const room = await db.collection<RoomDoc>("rooms").findOne({ _id: input.roomId });
  const member = room ? await db.collection<MemberDoc>("room_members").findOne({ roomId: room._id, userId: input.userId, status: "active" }) : null;
  if (!room || !member) throw new JudgeError(404, "This room was not found, or you are not a member of it.");
  if (effectiveStatus(room, now) !== "active") throw new JudgeError(409, "This room has ended. Submissions are closed.");
  const validating = input.purpose === "validate";
  if (validating && member.role !== "host") throw new JudgeError(403, "Only the room host can validate a problem.");
  if (!validating && !hasStarted(room, now)) throw new JudgeError(409, "This room has not started yet.");
  let problem: JudgeableProblem;
  if (input.refKey.startsWith("c-")) {
    if (validating) throw new JudgeError(400, "Only custom problems need validation.");
    if (!await db.collection<RoomProblemDoc>("room_problems").findOne({ roomId: room._id, refKey: input.refKey })) throw new JudgeError(404, "This problem is not part of the room.");
    problem = fitCases(catalogJudgeable(input.refKey.slice(2)), input.maxCases);
  } else {
    const collection = db.collection<CustomProblemDoc>("custom_problems");
    const custom = await collection.findOne({ _id: input.refKey.slice(2), roomId: room._id });
    if (!custom) throw new JudgeError(404, "This problem is not part of the room.");
    if (validating) { if (custom.validated) throw new JudgeError(409, "This problem is already validated."); }
    else {
      // Unlisted problems look exactly like missing ones, so members cannot probe for drafts.
      if (!await db.collection<RoomProblemDoc>("room_problems").findOne({ roomId: room._id, refKey: input.refKey })) throw new JudgeError(404, "This problem is not part of the room.");
      if (!custom.validated) throw new JudgeError(409, "This problem is not ready yet.");
      // Locking against the exact tests we loaded means the host cannot swap them between now and grading.
      if (input.mode === "submit" && !custom.testsLocked && !(await collection.updateOne({ _id: custom._id, validated: true, testsHash: custom.testsHash }, { $set: { testsLocked: true } })).matchedCount)
        throw new JudgeError(409, "This problem was just edited. Reload and try again.");
    }
    problem = customJudgeable(custom);
  }
  if (!problem.languages.includes(input.language))
    throw new JudgeError(400, `This problem supports ${problem.languages.join(", ")} only.`);
  if (!validating && input.mode === "submit") await db.collection<RoomProblemDoc>("room_problems").updateOne({ roomId: room._id, refKey: input.refKey }, { $set: { locked: true } });
  return { problem, room };
}

export async function problemDetail(db: Db, room: RoomDoc, refKey: string) {
  const listed = await db.collection<RoomProblemDoc>("room_problems").findOne({ roomId: room._id, refKey });
  if (!listed) throw new JudgeError(404, "This problem is not part of the room.");
  if (refKey.startsWith("c-")) {
    const problem = loadCatalogProblem(refKey.slice(2));
    if (!catalogEligible(problem)) throw new JudgeError(404, "This problem is no longer available.");
    return { refKey, source: "catalog" as const, title: problem.title, difficulty: problem.difficulty, statement: cleanBlock(problem.descriptionMd, 20_000),
      constraints: problem.constraints ?? [], languages: [...CATALOG_LANGUAGES], starters: { java: "", python: problem.starterCode.python, javascript: problem.starterCode.javascript },
      visibleCases: catalogExamples(problem), locked: !!listed.locked };
  }
  const custom = await db.collection<CustomProblemDoc>("custom_problems").findOne({ _id: refKey.slice(2), roomId: room._id });
  if (!custom) throw new JudgeError(404, "This problem is no longer available.");
  return { refKey, source: "custom" as const, title: cleanText(custom.title, 100), difficulty: custom.difficulty, statement: custom.statement, constraints: [] as string[],
    languages: ["java", "python", "javascript"] as JudgeLanguage[], starters: custom.starterCode, locked: !!listed.locked,
    visibleCases: custom.testCases.filter(item => !item.isHidden).map(item => ({ id: `case-${item.order}`, stdin: item.input, expected: item.expectedOutput })) };
}
