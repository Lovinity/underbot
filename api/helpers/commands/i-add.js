module.exports = {


  friendlyName: 'I add',


  description: 'Add/equip an item to a character inventory',


  inputs: {
    message: {
      type: 'ref',
      required: true,
      description: 'Starts a wizard to add a new character into the database.'
    },
    character: {
      type: 'string',
      required: true,
      description: 'The name of the character in the database to add an item.'
    },
    name: {
      type: 'string',
      required: true,
      description: 'Name of the item'
    },
    description: {
      type: 'string',
      required: true,
      description: 'Description of the item'
    },
  },


  exits: {

  },


  fn: async function (inputs) {
    // Delete original command message
    inputs.message.delete();

    // Check permissions
    if (!inputs.message.member.permissions.has('VIEW_AUDIT_LOG') && inputs.message.author.id !== sails.config.custom.discord.clientOwner) {
      throw new Error(`You are not allowed to use this command.`);
    }

    // Get the character
    var character = inputs.message.guild.characters.find((char) => char.name.toLowerCase() === inputs.character.toLowerCase());

    // Check if the character exists
    if (!character) {
      throw new Error(`That character was not found in the database.`)
    }

    // Add the item to the repository
    character.items.push({ name: inputs.name, description: inputs.description });

    // Save to the database and cache
    Caches.get('characters').set([ character.uid ], () => {
      return { items: character.items }
    })

    // Return message
    return inputs.message.send(`**${character.name} has a [new] item!**: ${inputs.name}: ${inputs.description}`);
  }


};

