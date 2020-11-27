module.exports = {
  friendlyName: "tasks.removeCharacter",

  description: "Removes a character",

  inputs: {
    uid: {
      type: "string",
      required: true,
      description: "The UID of the character to remove."
    }
  },

  exits: {},

  fn: async function(inputs) {
    // Get the character from the database
    var character = await sails.models.characters.findOne({ uid: inputs.uid });

    // Exit if the character was not found
    if (!character) {
      return;
    }

    // If userID is already null, exit
    if (!character.userID) {
      return;
    }

    // Get the guild
    var guild = DiscordClient.guilds.resolve(character.guildID);

    // If guild exists, check to make sure member really is not in it. If they do, exit. Otherwise, remove owner for non-OC or delete for OC.
    if (guild && guild.members.resolve(character.userID)) {
      return;
    } else {
      if (character.claimable) {
        if (guild)
          await sails.helpers.guild.send(
            `characterDeletionChannel`,
            guild,
            `The previous owner of the character **${character.name}** has been gone from the guild for over 24 hours. **This character may now be claimed by someone else**.`
          );
        await sails.models.characters.updateOne(
          { uid: inputs.uid },
          { userID: null }
        );
      } else {
        if (guild)
          await sails.helpers.guild.send(
            `characterDeletionChannel`,
            guild,
            `The previous owner of the character **${character.name}** has been gone from the guild for over 24 hours. This character cannot be claimed by others, therefore, it has disintegrated into dust and left the role play.`
          );
        await sails.models.characters.destroyOne({ id: character.id });
      }
    }
  }
};
