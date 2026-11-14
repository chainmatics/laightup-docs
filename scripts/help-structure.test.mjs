import test from "node:test";
import assert from "node:assert/strict";
import {
  validateStructure,
  orderedPages,
  movePage,
  shiftPage,
} from "../docs/helpcenter/lib/structure.mjs";
const groups = [{ id: "a" }, { id: "b" }];
const pages = [
  { id: "first", group: "a" },
  { id: "child", group: "a", parentId: "first" },
  { id: "last", group: "a" },
  { id: "other", group: "b" },
];
test("reordering keeps a page and its descendants together among siblings", () => {
  const reordered = shiftPage(groups, pages, "first", 1);
  assert.deepEqual(
    reordered.map((p) => p.id),
    ["last", "first", "child", "other"],
  );
  assert.deepEqual(
    shiftPage(groups, reordered, "first", -1).map((p) => p.id),
    pages.map((p) => p.id),
  );
  assert.equal(shiftPage(groups, pages, "first", -1), pages);
});
test("cross-topic moves update the whole subtree and preserve child parents and insertion position", () => {
  const result = movePage(groups, pages, "first", {
    group: "b",
    parentId: "other",
  });
  assert.deepEqual(
    orderedPages(groups, result).map((p) => [p.id, p.depth]),
    [
      ["last", 0],
      ["other", 0],
      ["first", 1],
      ["child", 2],
    ],
  );
  assert.equal(result.find((p) => p.id === "child").parentId, "first");
  assert.equal(result.find((p) => p.id === "child").group, "b");
  assert.deepEqual(
    movePage(groups, pages, "last", { group: "a", beforeId: "first" }).map(
      (p) => p.id,
    ),
    ["last", "first", "child", "other"],
  );
});
test("cycles, cross-topic parents, orphans, duplicate ids and excess depth are rejected", () => {
  assert.throws(() =>
    movePage(groups, pages, "first", { group: "a", parentId: "child" }),
  );
  assert.throws(() =>
    validateStructure(groups, [
      ...pages,
      { id: "orphan", group: "a", parentId: "missing" },
    ]),
  );
  assert.throws(() =>
    validateStructure(groups, [
      ...pages,
      { id: "wrong", group: "b", parentId: "first" },
    ]),
  );
  assert.throws(() => validateStructure(groups, [...pages, pages[0]]));
  assert.throws(() =>
    validateStructure(groups, [
      ...pages,
      { id: "grand", group: "a", parentId: "child" },
      { id: "too-deep", group: "a", parentId: "grand" },
    ]),
  );
  assert.throws(() =>
    validateStructure(groups, [
      { id: "x", group: "a", parentId: "y" },
      { id: "y", group: "a", parentId: "x" },
    ]),
  );
});
test("published descendants cannot be moved below a draft; draft branches can be nested safely", () => {
  const draft = { id: "draft", group: "a", status: "draft" };
  assert.throws(() =>
    movePage(groups, [...pages, draft], "first", {
      group: "a",
      parentId: "draft",
    }),
  );
  assert.doesNotThrow(() =>
    validateStructure(groups, [
      ...pages,
      draft,
      { id: "draft-child", group: "a", parentId: "draft", status: "draft" },
    ]),
  );
});
