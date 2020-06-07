module.exports = {


  friendlyName: 'commands.iRemove',


  description: 'Remove an item from a character',


  inputs: {
    message: {
      type: 'ref',
      required: true,
      description: 'Starts a wizard to add a new character into the database.'
    },
    character: {
      type: 'string',
      required: true,
      description: 'The name of the character in the database to remove an item from.'
    },
    name: {
      type: 'string',
      required: true,
      description: 'Name of the item to remove. If multiple items exist with the same name, only one of them will be removed.'
    },
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
      throw new Error(`Only the character owner or staff may remove items from the character.`)
    }

    // Find one instance of the item
    var item = character.items.find((i) => i.name.toLowerCase() === inputs.name.toLowerCase());

    // Exit if the item does not exist
    if (!item) {
      throw new Error(`That character does not have an item by the specified name.`)
    }

    // Remove only one of the items
    var deleted = false;
    character.items = character.items.filter((i) => {
      if (i.name.toLowerCase() === inputs.name.toLowerCase() && !deleted) {
        deleted = true;
        item = i;
        return false;
      }
      return true;
    })

    // Save to cache / database
    Caches.get('characters').set([ character.uid ], () => {
      return { items: character.items }
    })

    // Return message
    return inputs.message.send(`**${character.name} has consumed / lost / removed an item!**: ${item.name}: ${item.description}`);
  }


};

