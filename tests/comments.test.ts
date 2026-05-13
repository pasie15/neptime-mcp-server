import assert from "node:assert/strict";
import test from "node:test";
import { articleCommentsEndpoint } from "../src/tools/comments.ts";

test("articleCommentsEndpoint builds the documented article comments route", () => {
  assert.equal(articleCommentsEndpoint(42), "articles/42/comments");
});
