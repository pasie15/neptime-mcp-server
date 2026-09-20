import assert from "node:assert/strict";
import test from "node:test";
import { buildYoutubeImportForm } from "../src/tools/youtube.ts";

test("buildYoutubeImportForm marks shorts and uses youtube import fields", () => {
  const form = buildYoutubeImportForm({
    youtube_id: "dQw4w9WgXcQ",
    title: "Short title",
    description: "Short description",
    tags: "news,short",
    privacy: 0,
    is_short: true,
    category_id: "11",
    duration: "00:00:42",
    thumbnail_url: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg"
  });

  assert.equal(form.get("video-id"), "dQw4w9WgXcQ");
  assert.equal(form.get("video-type"), "youtube");
  assert.equal(form.get("is_short"), "1");
  assert.equal(form.get("privacy"), "0");
  assert.equal(form.get("category_id"), "11");
  assert.equal(form.get("duration"), "00:00:42");
});
