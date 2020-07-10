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

    // Delete all prior messages first
    if (inputs.message.guild.settings.ocChannel) {
      var channel = await inputs.message.guild.channels.resolve(
        inputs.message.guild.settings.ocChannel
      );
      if (channel) {
        var maps = inputs.message.guild.characters.map(async (character) => {
          if (character.ocMessage) {
            try {
              var message = await channel.messages.fetch(character.ocMessage);
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

    // Set new ocChannel
    Caches.get("guilds").set([inputs.message.guild.id], {
      ocChannel: inputs.message.channel.id,
    });

    // Loop through each character in the database and create a stats message
    var maps2 = inputs.message.guild.characters
      .filter((character) => character.OC)
      .map(async (character) => {
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
        Caches.get("characters").set([character.uid], {
          ocMessage: message.id,
        });
      });
    await Promise.all(maps2);
  },
};
