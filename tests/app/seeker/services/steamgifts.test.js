const settingsMock = require('../__mocks/settingsMock')
const steamGifts = require('../../../../src/app/seeker/services/steamgifts')

const createGiveaway = (number, fields = {}) => {
  return Object.assign(
    {
      url: 'http://sg.com',
      cost: 0,
      copies: 1,
      entries: 100,
      timeLeft: 300,
      levelRequired: 0,
      levelPass: true,
      name: 'giveaway ' + number,
      code: 'giveaway' + number,
      entered: false,
      winChance: 100
    },
    fields
  )
}

const defaultValue = 300

const commonGiveaways = [
  createGiveaway(1),
  createGiveaway(2, { entered: true }),
  createGiveaway(3, { levelPass: false })
]

describe('Entry logic', () => {
  const cases = [
    {
      toString: () => 'Default settings',
      expectTruthy: ['giveaway1']
    },
    {
      toString: () => 'Check required level',
      giveaways: [
        createGiveaway(1, {
          levelRequired: 3
        }),
        createGiveaway(2, {
          levelRequired: 4
        }),
        createGiveaway(3, {
          levelRequired: 5
        })
      ],
      settings: {
        steamgifts_min_level: 4
      },
      expectTruthy: ['giveaway2', 'giveaway3']
    }
  ]
  test.each(cases)('%s', async (caseData) => {
    settingsMock.setup(caseData.settings || {})
    for (const giveaway of caseData.giveaways || commonGiveaways) {
      const truthyCodes = caseData.expectTruthy || []
      steamGifts.setValue(caseData.currentValue || defaultValue)
      const canEnter = steamGifts.canEnterGiveaway(
        giveaway,
        caseData.wishlistPage || false
      )
      expect(canEnter).toEqual(truthyCodes.includes(giveaway.code))
    }
  })
})
