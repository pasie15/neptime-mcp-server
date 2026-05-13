import assert from "node:assert/strict";
import test from "node:test";
import { buildVideoUploadForm } from "../src/tools/uploads.ts";

test("buildVideoUploadForm creates Neptime /videos/upload multipart fields", () => {
  const form = buildVideoUploadForm({
    title: "Smoke upload",
    description: "Upload description",
    tags: "mcp,test",
    video_base64: Buffer.from("video bytes").toString("base64"),
    video_filename: "smoke.mp4",
    privacy: 1,
    age_restriction: 1,
    is_short: false,
  });

  assert.equal(form.get("title"), "Smoke upload");
  assert.equal(form.get("description"), "Upload description");
  assert.equal(form.get("tags"), "mcp,test");
  assert.equal(form.get("privacy"), "1");
  assert.equal(form.get("age_restriction"), "1");
  assert.equal(form.get("is_short"), "0");
  assert.ok(form.get("video") instanceof Blob);
});
