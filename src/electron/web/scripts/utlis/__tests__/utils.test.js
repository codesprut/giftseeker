import { elapsed } from "../time";

describe("Elapsed method", () => {
  const cases = [
    {
      toString: () => "Works correctly with time less an minute",
      timestamp: 59,
      expected: "59",
    },
    {
      toString: () => "Works correctly with time less an hour",
      timestamp: 125,
      expected: "02:05",
    },
    {
      toString: () => "Works correctly with time over an hour",
      timestamp: 3669,
      expected: "01:01:09",
    },
    {
      toString: () => "Works correctly with time over an hour:case 2",
      timestamp: 3609,
      expected: "01:00:09",
    },
  ];

  test.each(cases)("%s", async caseData => {
    const actual = elapsed(caseData.timestamp);

    expect(actual).toBe(caseData.expected);
  });
});
