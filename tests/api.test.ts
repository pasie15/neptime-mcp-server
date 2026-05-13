import assert from "node:assert/strict";
import test from "node:test";
import {
  assertSuccessfulApiResponse,
  prepareRequestBody,
} from "../src/services/api.ts";

test("prepareRequestBody sends plain objects as JSON", () => {
  const prepared = prepareRequestBody({ title: "Updated title" });

  assert.deepEqual(prepared.data, { title: "Updated title" });
  assert.equal(prepared.contentType, "application/json");
});

test("prepareRequestBody preserves multipart FormData", () => {
  const form = new FormData();
  form.append("title", "Upload title");

  const prepared = prepareRequestBody(form);

  assert.equal(prepared.data, form);
  assert.equal(prepared.contentType, undefined);
});

test("assertSuccessfulApiResponse throws API error messages when success is false", () => {
  assert.throws(
    () => assertSuccessfulApiResponse({
      success: false,
      error: { code: "NO_UPDATES", message: "No valid fields to update" },
    }),
    /NO_UPDATES: No valid fields to update/
  );
});
