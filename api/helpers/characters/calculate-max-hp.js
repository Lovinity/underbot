module.exports = {
  friendlyName: "characters.calculateMaxHp",

  description: "Calculate the maximum HP of a character",

  inputs: {
    character: {
      type: "ref",
      required: true,
      description: "the character record",
    },
  },

  exits: {},

  fn: async function (inputs) {
    // If maxHP is set, return that instead of calculating by level
    if (inputs.character.maxHP !== 0) return inputs.character.maxHP;

    // Determine current level
    var lvl = await sails.helpers.characters.calculateLevel(inputs.character);

    // Determine maxHP based on level
    var maxHP = 20;
    if (lvl >= 20) {
      maxHP = 99;
    } else {
      maxHP += (lvl - 1) * 4;
    }

    return maxHP;
  },
};
