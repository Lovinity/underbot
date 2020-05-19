module.exports = {


  friendlyName: 'commands.hpSet',


  description: 'Sets a specific HP value to the provided character.',


  inputs: {
    message: {
      type: 'ref',
      required: true,
      description: 'The message that triggered the command'
    },
    character: {
      type: 'string',
      required: true,
      description: 'The name of the character in the database to set the HP of.'
    },
    HP: {
      type: 'number',
      required: true,
      min: 0,
      description: 'HP value to set to the character.'
    }
  },


  exits: {

  },


  fn: async function (inputs) {
    // Delete original command message
    inputs.message.delete();

    // Get the character
    var character = inputs.message.guild.characters.find((char) => char.name.toLowerCase() === inputs.character.toLowerCase());

    // Check if the character exists
    if (!character) {
      throw new Error(`That character was not found in the database.`)
    }

    // Check if we have permission to do this
    if (character.userID !== inputs.message.author.id && !inputs.message.member.permissions.has('VIEW_AUDIT_LOG') && inputs.message.author.id !== sails.config.custom.discord.clientOwner) {
      throw new Error(`Only the character owner or staff may change HP.`)
    }

    // Deal damage. But only permit a minimum HP of 0.
    var newHP = inputs.HP;
    var maxHP = await sails.helpers.characters.calculateMaxHp(character);
    if (newHP <= 0) {
      newHP = 0;
    }

    // Fetch the HP percentile
    var percent = maxHP > 0 ? newHP / maxHP : 0;

    // Determine emojis to use
    var hpBar = ``;
    for (var i = 0; i < 20; i++) {
      if (percent > (i / 20)) {
        hpBar += `:green_heart: `
      } else {
        hpBar += `:black_heart: `
      }
    }

    // Set the new HP
    Caches.get('characters').set([ character.uid ], () => {
      return { HP: newHP };
    })

    // Send a message

    return inputs.message.send(`**HP set for ${character.name}**
    
HP: ${newHP} / ${maxHP} HP ${newHP <= 0 ? `**DEAD**` : ``}
${hpBar}`);
  }


};

