import test from "node:test";
import assert from "node:assert/strict";
const score = (likes, dislikes, comments) => likes - dislikes + comments * 2;
test("ranking rewards useful discussion", () =>
  assert.equal(score(3, 1, 2), 6));
test("a dislike reduces ranking", () => assert.equal(score(1, 2, 0), -1));
test("one comment has the same weight as two likes", () =>
  assert.equal(score(0, 0, 1), score(2, 0, 0)));
test("the feed can rank a discussion below zero", () =>
  assert.equal(score(0, 3, 1), -1));
