module.exports = {
  friendlyName: "commands.hp",

  description: "Get the current HP of the provided character.",

  inputs: {
    message: {
      type: "ref",
      required: true,
      description: "The message that triggered the command",
    },
    character: {
      type: "string",
      required: true,
      description:
        "The name of the character in the database to get the HP of.",
    },
  },

  exits: {},

  fn: async function (inputs) {
    // Delete original command message
    inputs.message.delete();

    let guildCharacters = await inputs.message.guild.characters();

    // Get the character
    var character = guildCharacters.find(
      (char) => char.name.toLowerCase() === inputs.character.toLowerCase()
    );

    // Check if the character exists
    if (!character) {
      throw new Error(`That character was not found in the database.`);
    }

    var maxHP = await sails.helpers.characters.calculateMaxHp(character);

    // Fetch the HP percentile
    var percent = maxHP > 0 ? character.HP / maxHP : 0;

    // Determine emojis to use
    var hpBar = ``;
    for (var i = 0; i < 20; i++) {
      if (percent > i / 20) {
        hpBar += `:green_heart: `;
      } else {
        hpBar += `:black_heart: `;
      }
    }

    // Send a message

    return inputs.message.send(`**Current HP for ${character.name}**
    
HP: ${character.HP} / ${maxHP} HP ${character.HP <= 0 ? `**DEAD**` : ``}
${hpBar}`);
  },
};
