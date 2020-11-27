module.exports = {
  friendlyName: "helpers.commands.cOcChannel",

  description: "Generate messages for OC characters",

  inputs: {
    message: {
      type: "ref",
      required: true,
      description: "Starts a wizard to add a new character into the database.",
    },
  },

  exits: {},

  fn: async function (inputs) {
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

    if (guildSettings.ocChannel) {
      var channel = await DiscordClient.channels.resolve(
        guildSettings.ocChannel
      );
      if (channel) {
        var maps2 = guildCharacters
          .filter((character) => character.ocMessage)
          .map(async (character) => {
            try {
              var message = await channel.messages.fetch(character.ocMessage);
              await message.edit(
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
            } catch (e) {}
          });
        await Promise.all(maps2);
      }
    }

    if (guildSettings.ogChannel) {
      var channel = await DiscordClient.channels.resolve(
        guildSettings.ogChannel
      );
      if (channel) {
        var maps2 = guildCharacters
          .filter((character) => character.ogMessage)
          .map(async (character) => {
            try {
              var message = await channel.messages.fetch(character.ogMessage);
              await message.edit(
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
            } catch (e) {}
          });
        await Promise.all(maps2);
      }
    }
  },
};
