import assert from "node:assert/strict";
import test from "node:test";
import { getPreviousView, pushViewHistory } from "./viewHistory.js";

test("pushViewHistory stores the previous view when navigating to a new view", () => {
  assert.deepEqual(pushViewHistory([], "home", "tree"), ["home"]);
});

test("pushViewHistory ignores duplicate navigation", () => {
  assert.deepEqual(pushViewHistory(["home"], "tree", "tree"), ["home"]);
});

test("getPreviousView returns the previous view and remaining history", () => {
  assert.deepEqual(getPreviousView(["home", "tree"], "list"), {
    previousView: "tree",
    history: ["home"]
  });
});

test("getPreviousView falls back to home when history is empty", () => {
  assert.deepEqual(getPreviousView([], "list"), {
    previousView: "home",
    history: []
  });
});
