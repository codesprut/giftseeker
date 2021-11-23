const clearHtmlTags = require("../clear-html-tags");

const commonHtmlCode =
  "<html><script></script><hr><input/><span></span><s></s><span></span></html>";

const cases = [
  {
    toString: () => "Root node removed",
    clearTags: ["html"],
    expected: "",
  },
  {
    toString: () => "Nothing removed if no one tag found",
    clearTags: ["br", "p", "i"],
    expected: commonHtmlCode,
  },
  {
    toString: () => "Nothing removed if no one tag provided",
    clearTags: [],
    expected: commonHtmlCode,
  },
  {
    toString: () => "Remove once found tag",
    clearTags: ["script"],
    expected: "<html><hr><input/><span></span><s></s><span></span></html>",
  },
  {
    toString: () => "Multiple found tags removed",
    clearTags: ["span"],
    expected: "<html><script></script><hr><input/><s></s></html>",
  },
  {
    toString: () => "Multiple found different tags removed",
    clearTags: ["span", "script"],
    expected: "<html><hr><input/><s></s></html>",
  },
  {
    toString: () => "Single tag node removed",
    html: "<html><hr></html>",
    clearTags: ["hr"],
    expected: "<html></html>",
  },
  {
    toString: () => "Tag with attributes removed",
    html: "<html><div></div><span id='to-be-removed' data-remove='true'></span></html>",
    clearTags: ["span"],
    expected: "<html><div></div></html>",
  },
];
test.each(cases)("%s", async caseData => {
  expect(
    clearHtmlTags(caseData.html || commonHtmlCode, caseData.clearTags),
  ).toEqual(caseData.expected);
});
