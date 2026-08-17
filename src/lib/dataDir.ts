import os from "os";
import path from "path";

/**
 * Writable scratch directory for the on-disk cache and budget tracker.
 * Serverless platforms (Vercel, etc.) ship the deployed app as a read-only
 * bundle - `process.cwd()` isn't writable there, only the OS temp dir is.
 * `os.tmpdir()` resolves to that on every platform (including plain local
 * dev), so this one path works everywhere without environment detection.
 *
 * Caveat: on serverless, /tmp is only guaranteed to persist for the life of
 * one warm function instance, and isn't shared across concurrent instances.
 * That's fine for the response cache (worst case: an extra live call), but
 * it means the daily budget cap can't be perfectly enforced across
 * instances there - see the README's deployment notes.
 */
export const DATA_DIR = path.join(os.tmpdir(), "fantasy-football-dashboard");
