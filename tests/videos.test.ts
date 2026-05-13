import assert from "node:assert/strict";
import test from "node:test";
import { isVideoNotFoundMessage } from "../src/tools/videos.ts";

test("isVideoNotFoundMessage matches API video-not-found responses", () => {
  assert.equal(isVideoNotFoundMessage("Error: VIDEO_NOT_FOUND: Video not found"), true);
  assert.equal(isVideoNotFoundMessage("Error: API request failed"), false);
});
