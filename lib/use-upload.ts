"use client";

import { useCallback, useRef, useState } from "react";

/**
 * Studio upload with real progress.
 *
 * `fetch` cannot report request-body progress, so this uses XHR — the
 * only way to drive a truthful percentage bar for a file going *up*.
 * Deliberately format-agnostic: it posts whatever it's given to
 * /api/upload and reports bytes sent, so adding video later needs no
 * change here.
 */

export type UploadResult = { url: string; blurData: string };

export type UploadJob = {
  id: string;
  name: string;
  /** 0–100, bytes sent over bytes total. */
  progress: number;
  /** Set once the bytes are up and the server is still processing. */
  processing: boolean;
  error?: string;
};

const ENDPOINT = "/api/upload";

function postWithProgress(
  file: File,
  onProgress: (percent: number) => void,
  signal: AbortSignal,
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const form = new FormData();
    form.set("file", file);

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    });

    xhr.addEventListener("load", () => {
      let body: unknown = null;
      try {
        body = JSON.parse(xhr.responseText);
      } catch {
        /* fall through to the generic message below */
      }
      if (xhr.status >= 200 && xhr.status < 300 && body && typeof body === "object") {
        resolve(body as UploadResult);
      } else {
        const message =
          body && typeof body === "object" && "error" in body
            ? String((body as { error: unknown }).error)
            : "Upload failed, please try again.";
        reject(new Error(message));
      }
    });

    xhr.addEventListener("error", () =>
      reject(new Error("Upload failed, check your connection and try again.")),
    );
    xhr.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));

    signal.addEventListener("abort", () => xhr.abort(), { once: true });

    xhr.open("POST", ENDPOINT);
    xhr.send(form);
  });
}

export function useUpload() {
  const [jobs, setJobs] = useState<UploadJob[]>([]);
  const idRef = useRef(0);
  const controllers = useRef(new Map<string, AbortController>());

  const patch = useCallback((id: string, next: Partial<UploadJob>) => {
    setJobs((list) => list.map((j) => (j.id === id ? { ...j, ...next } : j)));
  }, []);

  const clear = useCallback((id: string) => {
    controllers.current.delete(id);
    setJobs((list) => list.filter((j) => j.id !== id));
  }, []);

  /**
   * Upload one file. Resolves with the stored URL, or `null` if it
   * failed or was cancelled — the failed job stays in `jobs` carrying
   * its error message so the form can show it inline.
   */
  const upload = useCallback(
    async (file: File): Promise<UploadResult | null> => {
      const id = `u${idRef.current++}`;
      const controller = new AbortController();
      controllers.current.set(id, controller);
      setJobs((list) => [...list, { id, name: file.name, progress: 0, processing: false }]);

      try {
        const result = await postWithProgress(
          file,
          // At 100% the bytes are up but sharp is still re-encoding —
          // switch the bar to an indeterminate "processing" state so it
          // never sits at 100% looking stuck.
          (percent) => patch(id, { progress: percent, processing: percent >= 100 }),
          controller.signal,
        );
        clear(id);
        return result;
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") {
          clear(id);
          return null;
        }
        patch(id, {
          processing: false,
          error: e instanceof Error ? e.message : "Upload failed.",
        });
        return null;
      }
    },
    [patch, clear],
  );

  const cancel = useCallback((id: string) => {
    controllers.current.get(id)?.abort();
  }, []);

  /** True while any file is still in flight — for disabling save. */
  const busy = jobs.some((j) => !j.error);

  return { jobs, upload, cancel, dismiss: clear, busy };
}
