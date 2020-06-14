module.exports = {


  friendlyName: 'commands.dtSet',


  description: 'Sets a determination (DT) level for a character.',


  inputs: {
    message: {
      type: 'ref',
      required: true,
      description: 'The message that triggered the command'
    },
    character: {
      type: 'string',
      required: true,
      description: 'The name of the character in the database to set the DT of.'
    },
    DT: {
      type: 'number',
      required: true,
      min: 0,
      max: 100,
      description: 'DT value to set to the character.'
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

    // Determine emojis to use
    var dtBar = ``;
    for (var i = 0; i < 20; i++) {
      if (inputs.DT > (i * 5)) {
        dtBar += `:heart: `
      } else {
        dtBar += `:black_heart: `
      }
    }

    // Set the new HP
    Caches.get('characters').set([ character.uid ], { DT: inputs.DT });

    var additional = ``;
    if (inputs.DT === 0) {
      additional = `:warning: **This character is suicidal** and will make attempts to "disappear" by harming their remaining HP until/unless they are saved.`
    } else if (inputs.DT < 6) {
      additional = `This character is suicidal, but will not actively act on it unless DT reaches 0.`
    } else if (inputs.DT < 26) {
      additional = `This character has low determination / motivation.`
    } else if (inputs.DT < 76) {
      additional = `This character has normal determination.`
    } else if (inputs.DT < 91) {
      additional = `This character is determined.`
    } else if (inputs.DT < 100) {
      additional = `:warning: **If this character is a monster, they are dangerously determined** and may start melting and taking HP at any point. Otherwise, this character is VERY determined.`
    } else if (inputs.DT === 100) {
      additional = `**This character is as determined as they can be.** They have the power to SAVE and RESET. And if genocidal, they will one-shot any monsters with a DT less than 91 (except Sans).`
    }

    // Send a message
    return inputs.message.send(`**DT (determination) set for ${character.name}**
    
DT: ${inputs.DT}
${additional}
${dtBar}`);
  }


};
