"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Rolling word for the hero headline: the word rises in through a text
 * mask each time it changes.
 *
 * Pass `index` to drive the word from outside instead of from the
 * internal clock. The hero does this, because its words are paired
 * one-to-one with photographs — a word on its own timer drifts against
 * the carousel until "endure" is sitting over a picture of a kitchen,
 * which is the note the client sent back in round 2.
 *
 * One element, remounted by `key`. That is the entire mechanism, and it
 * is deliberately the same one the line above it already uses: `key`
 * changes, React swaps the node, the `mask-rise` CSS animation runs from
 * the start. There is no animation state held anywhere between renders,
 * so there is nothing that can fall out of step with the index.
 *
 * Three earlier versions of this did fall out of step, and the history
 * is worth keeping because each looked correct in review:
 *
 *  1. `AnimatePresence mode="wait"` fed a controlled index. It wedged:
 *     the exiting word never resolved, the queued one never mounted, and
 *     the headline sat on one word for the rest of the cycle.
 *  2. All four words stacked in one grid cell, transforms driven by
 *     framer's `animate` prop. React re-rendered correctly — aria-hidden
 *     tracked the active word every slide — while the transforms stayed
 *     frozen at their mount values.
 *  3. The same stack with plain inline styles and a CSS transition. The
 *     style attribute updated correctly on every element and the
 *     computed style still did not follow it.
 *
 * Two and three shared a cause: a stack of persistent nodes whose
 * animated properties are rewritten in place, layered under a parent
 * that is itself running a filling CSS animation. Rather than keep
 * bisecting that interaction against a launch date, this drops the whole
 * category of problem — no persistence, no rewriting in place, no
 * competing declarations. A four-word headline does not need to hold
 * animation state, and this one has already been wrong once in front of
 * the client.
 *
 * The trade is the exit: the outgoing word is replaced rather than
 * animated up and out. Inside a mask, against a 1.1s photograph
 * crossfade, that reads as intended.
 *
 * `mask-safe` padding on the wrapper keeps serif descenders unclipped.
 */
export function RotatingWord({
  words,
  interval = 2800,
  index: controlled,
  className,
}: {
  words: readonly string[];
  interval?: number;
  /** Controlled index. When set, the internal timer never starts. */
  index?: number;
  className?: string;
}) {
  const [selfIndex, setSelfIndex] = useState(0);
  const isControlled = controlled !== undefined;

  const count = Math.max(words.length, 1);
  const raw = isControlled ? controlled : selfIndex;
  const active = ((raw % count) + count) % count;

  useEffect(() => {
    if (isControlled || words.length < 2) return;
    const id = setInterval(() => setSelfIndex((i) => (i + 1) % words.length), interval);
    return () => clearInterval(id);
  }, [isControlled, words.length, interval]);

  return (
    <span
      key={active}
      className={cn("mask-rise block whitespace-nowrap", className)}
    >
      {words[active]}
    </span>
  );
}
