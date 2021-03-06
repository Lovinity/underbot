module.exports = {
  friendlyName: "I add",

  description: "Add/equip an item to a character inventory",

  inputs: {
    message: {
      type: "ref",
      required: true,
      description: "Starts a wizard to add a new character into the database."
    },
    character: {
      type: "string",
      required: true,
      description: "The name of the character in the database to add an item."
    },
    name: {
      type: "string",
      required: true,
      description:
        "Name of the item. You can add multiple items with the same name (say, if the character has more than one of the same item)"
    },
    description: {
      type: "string",
      required: true,
      description: "Description of the item, such as how it affects game play"
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
      throw new Error(
        `Only the character owner or staff may add items to the character.`
      );
    }

    // Add the item to the repository
    character.items.push({
      name: inputs.name.toLowerCase(),
      description: inputs.description
    });

    // Save to the database and cache
    await sails.models.characters.updateOne(
      { uid: character.uid },
      { items: character.items }
    );

    // Return message
    return inputs.message.send(
      `**${character.name} has a [new] item!**: ${inputs.name.toLowerCase()}: ${
        inputs.description
      }`
    );
  }
};
