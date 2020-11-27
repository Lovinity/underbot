module.exports = {
  friendlyName: "commands.hpDamage",

  description: "Subtract from a character's HP",

  inputs: {
    message: {
      type: "ref",
      required: true,
      description: "The message that triggered the command"
    },
    character: {
      type: "string",
      required: true,
      description:
        "The name of the character in the database to inflict damage upon."
    },
    HP: {
      type: "number",
      required: true,
      min: 0,
      description: "Amount of HP damage to deal on the character."
    }
  },

  exits: {},

  fn: async function(inputs) {
    // Delete original command message
    inputs.message.delete();

    let guildCharacters = await inputs.message.guild.characters();

    // Get the character
    var character = guildCharacters.find(
      char => char.name.toLowerCase() === inputs.character.toLowerCase()
    );

    // Check if the character exists
    if (!character) {
      throw new Error(`That character was not found in the database.`);
    }

    // Check if we have permission to do this
    if (
      character.userID !== inputs.message.author.id &&
      !inputs.message.member.permissions.has("VIEW_AUDIT_LOG") &&
      inputs.message.author.id !== sails.config.custom.discord.clientOwner
    ) {
      throw new Error(`Only the character owner or staff may change HP.`);
    }

    // Deal damage. But only permit a minimum HP of 0.
    var newHP = character.HP - inputs.HP;
    var maxHP = await sails.helpers.characters.calculateMaxHp(character);
    if (newHP <= 0) {
      newHP = 0;
    }

    // Fetch the HP percentile
    var percent = maxHP > 0 ? newHP / maxHP : 0;

    // Determine emojis to use
    var hpBar = ``;
    for (var i = 0; i < 20; i++) {
      if (percent > i / 20) {
        hpBar += `:green_heart: `;
      } else {
        hpBar += `:black_heart: `;
      }
    }

    // Set the new HP
    await sails.models.characters.updateOne(
      { uid: character.uid },
      { HP: newHP }
    );

    // Send a message
    return inputs.message.send(`**Damage inflicted on ${character.name}**
    
Amount: ${inputs.HP} HP
Current HP: ${newHP} / ${maxHP} HP ${newHP <= 0 ? `**DEAD**` : ``}
${hpBar}`);
  }
};
