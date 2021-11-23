const { settingsMock } = require("../../../modules/__mocks__");
const steamGifts = require("../steamgifts");

const createGiveaway = (number, fields = {}) => {
  return Object.assign(
    {
      url: "https://sg.com",
      cost: 0,
      copies: 100,
      entries: 100,
      timeLeft: 300,
      levelRequired: 0,
      levelPass: true,
      name: "giveaway " + number,
      code: "giveaway" + number,
      entered: false,
      winChance: 100,
    },
    fields,
  );
};

const defaultValue = 300;

const commonGiveaways = [
  createGiveaway(1),
  createGiveaway(2, { entered: true }),
  createGiveaway(3, { levelPass: false }),
];

describe("Entry logic", () => {
  const cases = [
    {
      toString: () => "Default settings",
      expectTruthy: ["giveaway1"],
    },
    {
      toString: () => "Check required level",
      giveaways: [
        createGiveaway(1, {
          levelRequired: 3,
        }),
        createGiveaway(2, {
          levelRequired: 4,
        }),
        createGiveaway(3, {
          levelRequired: 5,
        }),
      ],
      settings: {
        steamgifts_min_level: 4,
      },
      expectTruthy: ["giveaway2", "giveaway3"],
    },
    {
      toString: () => "Pass by winning chance",
      settings: {
        steamgifts_min_chance: 2.3,
      },
      giveaways: [
        createGiveaway(1, {
          winChance: 0,
        }),
        createGiveaway(2, {
          winChance: 1.2,
        }),
        createGiveaway(3, {
          winChance: 2.3,
        }),
        createGiveaway(4, {
          winChance: 2.4,
        }),
        createGiveaway(5, {
          winChance: 100,
        }),
      ],
      expectTruthy: ["giveaway3", "giveaway4", "giveaway5"],
    },
    {
      toString: () => "Pass by ending time",
      settings: {
        steamgifts_ending: 2,
      },
      giveaways: [
        createGiveaway(1, {
          timeLeft: 50,
        }),
        createGiveaway(2, {
          timeLeft: 120,
        }),
        createGiveaway(3, {
          timeLeft: 121,
        }),
        createGiveaway(4, {
          timeLeft: 180,
        }),
      ],
      expectTruthy: ["giveaway1", "giveaway2"],
    },
  ];
  test.each(cases)("%s", async caseData => {
    settingsMock.setup(caseData.settings || {});
    for (const giveaway of caseData.giveaways || commonGiveaways) {
      const truthyCodes = caseData.expectTruthy || [];
      steamGifts.setValue(caseData.currentValue || defaultValue);
      const canEnter = steamGifts.canEnterGiveaway(
        giveaway,
        caseData.wishlistPage || false,
      );
      expect(canEnter).toEqual(truthyCodes.includes(giveaway.code));
    }
  });
});

describe("Winning chance calculation", () => {
  const cases = [
    {
      toString: () => "One copy and one entry",
      copies: 1,
      entries: 1,
      expectChance: 50,
    },
    {
      toString: () => "One copy without entries",
      copies: 1,
      entries: 0,
      expectChance: 100,
    },
    {
      toString: () => "Copies increase chance",
      copies: 2,
      entries: 1,
      expectChance: 100,
    },
    {
      toString: () => "Chance cannot be more than 100",
      copies: 50,
      entries: 0,
      expectChance: 100,
    },
  ];
  test.each(cases)("%s", async caseData => {
    const calculatedChance = steamGifts.calculateWinChance(
      caseData.copies,
      caseData.entries,
    );
    expect(calculatedChance).toEqual(caseData.expectChance);
  });
});
