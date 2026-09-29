import { useCallback, useState } from "react";
import { apiRequest, useRestQuery } from "@/api/client";

/**
 * Mijozlar fikri uchun 👍 / 👎 reaksiyalari.
 *
 * - Login qilmagan mijoz `localStorage`dagi barqaror sessiya kaliti orqali
 *   aniqlanadi, shuning uchun o'zi bosgan reaksiyani keyin ham ko'radi.
 * - Har bir fikr uchun bir kishi **bitta** reaksiya qoldiradi: 👍 va 👎 dan
 *   biri. Xuddi shu tugmani qayta bosish — bekor qilish, ikkinchisini bosish —
 *   almashtirish.
 * - Hisoblagichlar bazada (`records`, kind `review_reaction`) saqlanadi.
 */

const SESSION_KEY = "millytour.review.session";

function readSessionKey(): string {
  if (typeof window === "undefined") {
    return "server";
  }
  const existing = window.localStorage.getItem(SESSION_KEY);
  if (existing) {
    return existing;
  }
  const created = `rv-${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
  window.localStorage.setItem(SESSION_KEY, created);
  return created;
}

export type ReactionKind = "like" | "dislike";

export type ReactionCounts = Record<string, { like: number; dislike: number }>;
export type MyReactions = Record<string, ReactionKind>;

type ReactionsPayload = {
  counts: ReactionCounts;
  mine: MyReactions;
};

const EMPTY: ReactionsPayload = { counts: {}, mine: {} };

/** Bitta fikr uchun reaksiyani qayta hisoblash (optimistik yangilash uchun). */
function applyReaction(
  payload: ReactionsPayload,
  reviewId: string,
  kind: ReactionKind,
): ReactionsPayload {
  const current = payload.mine[reviewId] ?? null;
  const next: ReactionKind | null = current === kind ? null : kind;
  const base = payload.counts[reviewId] ?? { like: 0, dislike: 0 };
  const counts = { like: base.like, dislike: base.dislike };

  if (current) counts[current] = Math.max(0, counts[current] - 1);
  if (next) counts[next] += 1;

  const mine: MyReactions = { ...payload.mine };
  if (next) {
    mine[reviewId] = next;
  } else {
    delete mine[reviewId];
  }

  return { counts: { ...payload.counts, [reviewId]: counts }, mine };
}

export function useReviewReactions() {
  const [sessionKey] = useState(readSessionKey);
  const remote = useRestQuery<ReactionsPayload>("reviews", "reactions", { sessionKey });

  const [state, setState] = useState<ReactionsPayload>(EMPTY);
  const [synced, setSynced] = useState<ReactionsPayload | undefined>(undefined);
  const [busy, setBusy] = useState<string | null>(null);

  // Server javobi kelganda holatni bir marta moslashtiramiz — bu React
  // tavsiya qilgan "render paytida holatni yangilash" usuli (effect emas).
  if (remote && remote !== synced) {
    setSynced(remote);
    setState({ counts: remote.counts ?? {}, mine: remote.mine ?? {} });
  }

  const react = useCallback(
    async (reviewId: string, kind: ReactionKind) => {
      if (busy) {
        return;
      }
      setBusy(`${reviewId}:${kind}`);
      const previous = state;
      const optimistic = applyReaction(state, reviewId, kind);

      setState(optimistic);

      try {
        const result = await apiRequest<{
          reviewId: string;
          mine: ReactionKind | null;
          counts: { like: number; dislike: number };
        }>("reviews", "toggleReaction", { reviewId, kind, sessionKey });

        setState((prev) => {
          const mine: MyReactions = { ...prev.mine };
          if (result.mine) {
            mine[reviewId] = result.mine;
          } else {
            delete mine[reviewId];
          }
          return {
            counts: { ...prev.counts, [reviewId]: result.counts },
            mine,
          };
        });
      } catch (error) {
        console.error("[reviews.toggleReaction]", error);
        setState(previous);
      } finally {
        setBusy(null);
      }
    },
    [busy, sessionKey, state],
  );

  return { counts: state.counts, mine: state.mine, react, busy };
}
