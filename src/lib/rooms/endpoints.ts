import "server-only";
import type { Db } from "mongodb";
import type { ZodType } from "zod";
import { database } from "../db/client";
import { requireUser } from "../accounts/http";
import { errorResponse, json, jsonBody, requesterHash, sameOrigin, service } from "../judge0/http";
import { judgeRepository } from "../db/judge-repository";
import { JudgeError } from "../judge0/errors";
import {
  createRoom, effectiveStatus, hasStarted, hostContext, invitePreview, joinRoom, kickMember, leaveRoom, memberContext, myRooms, regenerateInvite,
  repairMemberCount, requireActive, roomMembers, updateRoom, type Person, type RoomDoc,
} from "../db/rooms";
import {
  addCatalogProblem, addCustomProblem, createCustomProblem, hostCustomProblem, hostCustomProblems, listRoomProblems, problemDetail, removeProblem, updateCustomProblem,
} from "../db/room-problems";
import { roomLeaderboard, roomMe } from "../db/room-stats";
import {
  addProblemInput, catalogSearchInput, createRoomInput, customProblemInput, inviteToken, leaderboardInput, lockedPatchInput, patchCustomProblemInput, patchRoomInput,
  refKey, regenerateInput, roomCode, userIdParam, validateInput,
} from "./contracts";
import { searchCatalog } from "./catalog";
import { memoryRateLimit } from "../ratelimit/memory";
import { Timer, routeLabel } from "../server-timing";

interface Ctx { db: Db; user: Person; request: Request; now: Date; ip: string }
type Params = Record<string, string>;
type Context = { params: Promise<Params> };
const FIELDS = "Check the highlighted fields and try again.";

async function person(request: Request): Promise<Person> {
  const user = await requireUser(request);
  if (!user.username) throw new JudgeError(403, "Private rooms need an account with a username.");
  return { id: user._id, username: user.username, displayName: user.displayName ?? user.name };
}
/** Wraps an endpoint: same-origin for writes, a signed-in account, a per-user write limit and uniform errors. */
function endpoint(options: { write?: boolean; message?: string; status?: number; read?: [name: string, perMinute: number] }, handler: (ctx: Ctx, params: Params) => Promise<unknown>) {
  return async (request: Request, context: Context) => {
    const timer = new Timer(routeLabel(request));
    try {
      if (options.write) sameOrigin(request);
      const user = await timer.measure("auth", () => person(request)), db = await database(), now = new Date();
      // Writes use the shared database limiter; reads only need the per-instance soft guard, so they skip a database round trip.
      if (options.write) await timer.measure("rate", () => judgeRepository(db).rateLimit(`rooms:write:${user.id}`, 60, now.getTime()));
      else memoryRateLimit(`${options.read?.[0] ?? "rooms:read"}:${user.id}`, options.read?.[1] ?? 120, now.getTime());
      return timer.finish(json(await timer.measure("work", async () => handler({ db, user, request, now, ip: requesterHash(request) }, await context.params)), options.status ?? 200));
    } catch (error) { return timer.finish(errorResponse(error, options.message ?? FIELDS)); }
  };
}
const param = <T>(schema: ZodType<T>, value: string | undefined, name: string): T => {
  const parsed = schema.safeParse(value);
  if (!parsed.success) throw new JudgeError(404, `That ${name} was not found.`);
  return parsed.data;
};
const limited = (ctx: Ctx, key: string, max: number, windowMs = 60_000) => judgeRepository(ctx.db).rateLimit(`${key}:${ctx.user.id}`, max, ctx.now.getTime(), 1, windowMs);
const HOUR = 3_600_000;
const iso = (value: Date | null | undefined) => value ? value.toISOString() : null;

async function view(db: Db, room: RoomDoc, isHost: boolean, now: Date) {
  const status = effectiveStatus(room, now), started = hasStarted(room, now);
  if (isHost) room = await repairMemberCount(db, room);
  const problems = isHost || started ? await listRoomProblems(db, room._id) : [];
  return { id: room._id, code: room.code, name: room.name, description: room.description, hostName: room.hostName, role: isHost ? "host" as const : "member" as const,
    status, started, startsAt: iso(room.startsAt), endsAt: iso(room.endsAt), createdAt: room.createdAt.toISOString(), maxMembers: room.maxMembers, memberCount: room.memberCount,
    problemCount: room.problemCount, problems: problems.map(item => ({ refKey: item.refKey, order: item.order, title: item.title, difficulty: item.difficulty,
      source: item.refKey.startsWith("c-") ? "catalog" as const : "custom" as const, ...(isHost ? { locked: !!item.locked } : {}) })),
    ...(isHost ? { invite: { token: room.inviteToken, expiresAt: iso(room.inviteExpiresAt) }, customCount: room.customCount } : {}) };
}
const summary = (item: { room: RoomDoc; role: string; status: string }) => ({ code: item.room.code, name: item.room.name, role: item.role, status: item.status,
  hostName: item.room.hostName, memberCount: item.room.memberCount, maxMembers: item.room.maxMembers, problemCount: item.room.problemCount,
  startsAt: iso(item.room.startsAt), endsAt: iso(item.room.endsAt) });

export const createRoomEndpoint = endpoint({ write: true, status: 201, message: "Check the room name (3–60 characters), member limit (1–100) and dates." }, async ctx => {
  await limited(ctx, "rooms:create", 5);
  await limited(ctx, "rooms:create:hour", 20, HOUR);
  const room = await createRoom(ctx.db, ctx.user, createRoomInput.parse(await jsonBody(ctx.request, 8_000)), ctx.now);
  return view(ctx.db, room, true, ctx.now);
});
export const myRoomsEndpoint = endpoint({}, async ctx => ({ rooms: (await myRooms(ctx.db, ctx.user.id, ctx.now)).map(summary) }));
export const catalogEndpoint = endpoint({ message: "Search with up to 80 characters.", read: ["rooms:catalog", 30] }, async ctx => ({
  problems: searchCatalog(...(({ q, limit }) => [q, limit] as const)(catalogSearchInput.parse(Object.fromEntries(new URL(ctx.request.url).searchParams)))),
  languages: ["javascript", "python"] }));
export const getRoomEndpoint = endpoint({}, async (ctx, params) => {
  const { room, isHost } = await memberContext(ctx.db, param(roomCode, params.code, "room"), ctx.user.id, ctx.now);
  return view(ctx.db, room, isHost, ctx.now);
});
export const patchRoomEndpoint = endpoint({ write: true, message: "Check the room name, member limit and dates." }, async (ctx, params) => {
  const { room } = await hostContext(ctx.db, param(roomCode, params.code, "room"), ctx.user.id, ctx.now);
  const updated = await updateRoom(ctx.db, room, patchRoomInput.parse(await jsonBody(ctx.request, 8_000)), ctx.now);
  return view(ctx.db, updated, true, ctx.now);
});
export const regenerateEndpoint = endpoint({ write: true, message: "Choose how long the new link should last." }, async (ctx, params) => {
  const { room } = await hostContext(ctx.db, param(roomCode, params.code, "room"), ctx.user.id, ctx.now);
  const next = await regenerateInvite(ctx.db, room, regenerateInput.parse(await jsonBody(ctx.request, 1_000)).expiry, ctx.now);
  return { invite: { token: next.inviteToken, expiresAt: iso(next.inviteExpiresAt) } };
});
export const leaveEndpoint = endpoint({ write: true }, async (ctx, params) => {
  const { room } = await memberContext(ctx.db, param(roomCode, params.code, "room"), ctx.user.id, ctx.now);
  return leaveRoom(ctx.db, room, ctx.user.id);
});
export const kickEndpoint = endpoint({ write: true }, async (ctx, params) => {
  const { room } = await hostContext(ctx.db, param(roomCode, params.code, "room"), ctx.user.id, ctx.now);
  requireActive(effectiveStatus(room, ctx.now));
  return kickMember(ctx.db, room, param(userIdParam, params.userId, "member"), ctx.now);
});
export const membersEndpoint = endpoint({}, async (ctx, params) => {
  const { room, isHost } = await memberContext(ctx.db, param(roomCode, params.code, "room"), ctx.user.id, ctx.now);
  // Only the host receives member ids (needed to remove someone); everyone else sees names.
  return { members: (await roomMembers(ctx.db, room._id)).map(item => ({ username: item.username, displayName: item.displayNameSnapshot, role: item.role,
    joinedAt: item.joinedAt.toISOString(), isYou: item.userId === ctx.user.id, ...(isHost ? { userId: item.userId } : {}) })) };
});

/** Public preview for the invite page: no login, and nothing about the problems. */
export async function previewInvite(request: Request, context: Context) {
  try {
    const db = await database(), token = param(inviteToken, (await context.params).inviteToken, "invite link");
    await judgeRepository(db).rateLimit(`rooms:preview:${requesterHash(request)}`, 60);
    return json(await invitePreview(db, token, new Date()));
  } catch (error) { return errorResponse(error); }
}
export const joinEndpoint = endpoint({ write: true }, async (ctx, params) => {
  const token = param(inviteToken, params.inviteToken, "invite link");
  await judgeRepository(ctx.db).rateLimit(`rooms:join:user:${ctx.user.id}`, 10, ctx.now.getTime());
  await judgeRepository(ctx.db).rateLimit(`rooms:join:ip:${ctx.ip}`, 10, ctx.now.getTime());
  await limited(ctx, "rooms:join:hour", 60, HOUR);
  return joinRoom(ctx.db, ctx.user, token, ctx.now);
});

export const addProblemEndpoint = endpoint({ write: true, status: 201, message: "Choose a catalog problem or a validated custom problem." }, async (ctx, params) => {
  const { room } = await hostContext(ctx.db, param(roomCode, params.code, "room"), ctx.user.id, ctx.now);
  requireActive(effectiveStatus(room, ctx.now));
  const input = addProblemInput.parse(await jsonBody(ctx.request, 2_000));
  const added = input.source === "catalog" ? await addCatalogProblem(ctx.db, room, input.problemId, ctx.now) : await addCustomProblem(ctx.db, room, input.customProblemId, ctx.now);
  return { refKey: added.refKey, order: added.order, title: added.title };
});
export const removeProblemEndpoint = endpoint({ write: true }, async (ctx, params) => {
  const { room } = await hostContext(ctx.db, param(roomCode, params.code, "room"), ctx.user.id, ctx.now);
  requireActive(effectiveStatus(room, ctx.now));
  return removeProblem(ctx.db, room, param(refKey, params.refKey, "problem"));
});
export const problemDetailEndpoint = endpoint({}, async (ctx, params) => {
  const { room, isHost } = await memberContext(ctx.db, param(roomCode, params.code, "room"), ctx.user.id, ctx.now);
  if (!isHost && !hasStarted(room, ctx.now)) throw new JudgeError(409, "This room has not started yet.");
  return { ...(await problemDetail(ctx.db, room, param(refKey, params.refKey, "problem"))), roomId: room._id, status: effectiveStatus(room, ctx.now) };
});

const customView = (doc: Awaited<ReturnType<typeof hostCustomProblem>>) => ({ id: doc._id, title: doc.title, statement: doc.statement, difficulty: doc.difficulty,
  starterCode: doc.starterCode, testCases: doc.testCases.map(item => ({ input: item.input, expectedOutput: item.expectedOutput, isHidden: item.isHidden })),
  validated: doc.validated, testsLocked: doc.testsLocked, updatedAt: doc.updatedAt.toISOString() });
export const createCustomEndpoint = endpoint({ write: true, status: 201, message: "Check the title, statement, starters and test cases (2–20, with at least one visible and one hidden)." }, async (ctx, params) => {
  const { room } = await hostContext(ctx.db, param(roomCode, params.code, "room"), ctx.user.id, ctx.now);
  requireActive(effectiveStatus(room, ctx.now));
  await limited(ctx, "rooms:custom", 20);
  await limited(ctx, "rooms:custom:hour", 60, HOUR);
  return customView(await createCustomProblem(ctx.db, room, ctx.user.id, customProblemInput.parse(await jsonBody(ctx.request, 700_000)), ctx.now));
});
export const listCustomEndpoint = endpoint({}, async (ctx, params) => {
  const { room } = await hostContext(ctx.db, param(roomCode, params.code, "room"), ctx.user.id, ctx.now);
  const listed = new Set((await listRoomProblems(ctx.db, room._id)).map(item => item.refKey));
  return { problems: (await hostCustomProblems(ctx.db, room._id)).map(doc => ({ ...customView(doc), inRoom: listed.has(`u-${doc._id}`) })) };
});
const customId = (params: Params) => param(refKey, `u-${params.id}`, "custom problem").slice(2);
export const getCustomEndpoint = endpoint({}, async (ctx, params) => {
  const { room } = await hostContext(ctx.db, param(roomCode, params.code, "room"), ctx.user.id, ctx.now);
  return customView(await hostCustomProblem(ctx.db, room._id, customId(params)));
});
export const patchCustomEndpoint = endpoint({ write: true, message: "Check the fields you changed." }, async (ctx, params) => {
  const { room } = await hostContext(ctx.db, param(roomCode, params.code, "room"), ctx.user.id, ctx.now);
  requireActive(effectiveStatus(room, ctx.now));
  const body = await jsonBody(ctx.request, 700_000), id = customId(params);
  const current = await hostCustomProblem(ctx.db, room._id, id);
  // Once members have submitted, only the title and statement may change.
  const patch = (current.testsLocked ? lockedPatchInput : patchCustomProblemInput).parse(body);
  return customView(await updateCustomProblem(ctx.db, room, id, patch, ctx.now));
});
/** Starts a normal judge job (all cases) for the host's reference solution; the client polls /api/judge/[jobId]. */
export const validateCustomEndpoint = endpoint({ write: true, status: 202, message: "Choose a language and paste your reference solution." }, async (ctx, params) => {
  const { room } = await hostContext(ctx.db, param(roomCode, params.code, "room"), ctx.user.id, ctx.now);
  requireActive(effectiveStatus(room, ctx.now));
  // Validation runs every test case on the shared judge, so it has its own hourly budget.
  await limited(ctx, "rooms:validate:hour", 30, HOUR);
  const input = validateInput.parse(await jsonBody(ctx.request, 40_000)), id = customId(params);
  await hostCustomProblem(ctx.db, room._id, id);
  return (await service()).create({ problemId: `u-${id}`, language: input.language, code: input.code, mode: "submit", roomId: room._id }, ctx.ip, ctx.user.id, { purpose: "validate" });
});

export const leaderboardEndpoint = endpoint({ message: "Choose a page size from 1 to 100.", read: ["rooms:board", 60] }, async (ctx, params) => {
  const { room } = await memberContext(ctx.db, param(roomCode, params.code, "room"), ctx.user.id, ctx.now);
  return roomLeaderboard(ctx.db, room, ctx.user.id, leaderboardInput.parse(Object.fromEntries(new URL(ctx.request.url).searchParams)));
});
export const meEndpoint = endpoint({}, async (ctx, params) => {
  const { room } = await memberContext(ctx.db, param(roomCode, params.code, "room"), ctx.user.id, ctx.now);
  return roomMe(ctx.db, room, ctx.user.id);
});
