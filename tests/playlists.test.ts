import assert from "node:assert/strict";
import test from "node:test";
import { findPlaylistById } from "../src/tools/playlists.ts";

test("findPlaylistById matches playlist list_id from a list response", () => {
  const playlist = findPlaylistById({
    success: true,
    data: [
      { list_id: "first", name: "First" },
      { list_id: "target", name: "Target" },
    ],
  }, "target");

  assert.deepEqual(playlist, { list_id: "target", name: "Target" });
});

test("findPlaylistById matches playlist id from the live list response", () => {
  const playlist = findPlaylistById({
    success: true,
    data: [
      { id: "first", name: "First" },
      { id: "target", name: "Target" },
    ],
  }, "target");

  assert.deepEqual(playlist, { id: "target", name: "Target" });
});
