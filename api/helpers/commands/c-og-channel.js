module.exports = {
  friendlyName: "helpers.commands.cOgChannel",

  description: "Generate messages for OG characters",

  inputs: {
    message: {
      type: "ref",
      required: true,
      description: "Starts a wizard to add a new character into the database."
    }
  },

  exits: {},

  fn: async function(inputs) {
    // Delete original command message
    inputs.message.delete();

    // Check permissions
    if (
      !inputs.message.member.permissions.has("VIEW_AUDIT_LOG") &&
      inputs.message.author.id !== sails.config.custom.discord.clientOwner
    ) {
      throw new Error(`You are not allowed to use this command.`);
    }

    let guildSettings = await inputs.message.guild.settings();
    let guildCharacters = await inputs.message.guild.characters();

    // Delete all prior messages first
    if (guildSettings.ogChannel) {
      var channel = await inputs.message.guild.channels.resolve(
        guildSettings.ogChannel
      );
      if (channel) {
        var maps = guildCharacters.map(async character => {
          if (character.ogMessage) {
            try {
              var message = await channel.messages.fetch(character.ogMessage);
              if (message) {
                await message.delete();
              }
            } catch (e) {
              // Absorb message fetch errors
            }
          }
        });
        await Promise.all(maps);
      }
    }

    // Set new ogChannel
    await sails.models.guilds.updateOne(
      { guildID: inputs.message.guild.id },
      { ogChannel: inputs.message.channel.id }
    );

    // Loop through each character in the database and create a stats message
    var maps2 = guildCharacters
      .filter(character => !character.OC)
      .map(async character => {
        var message = await inputs.message.channel.send(
          `**${character.name}** - ${
            character.userID
              ? `claimed by <@${character.userID}>`
              : `${
                  character.claimable
                    ? `UNCLAIMED (you can claim them by making a submission)`
                    : `UNCLAIMED (this character cannot be claimed at this time)`
                }`
          } (${sails.config.custom.baseURL}/character/${character.uid})`
        );
        await sails.models.characters.updateOne(
          { uid: character.uid },
          { ogMessage: message.id }
        );
      });
    await Promise.all(maps2);
  }
};
