module.exports = {
  friendlyName: "commands.cStatsChannel",

  description:
    "Execute this command in the text channel you want the bot to post and manage real-time stats for each character in the database. (staff-only command)",

  inputs: {
    message: {
      type: "ref",
      required: true,
      description: "The message that triggered the command",
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
    if (inputs.message.guild.settings.characterStatsChannel) {
      var channel = await inputs.message.guild.channels.resolve(
        inputs.message.guild.settings.characterStatsChannel
      );
      if (channel) {
        var maps = inputs.message.guild.characters.map(async (character) => {
          if (character.tallyMessage) {
            try {
              var message = await channel.messages.fetch(
                character.tallyMessage
              );
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

    // Set new characterStatsChannel
    Caches.get("guilds").set([inputs.message.guild.id], {
      characterStatsChannel: inputs.message.channel.id,
    });

    // Loop through each character in the database and create a stats message
    var maps2 = inputs.message.guild.characters.map(async (character) => {
      var embed = await sails.helpers.characters.generateStatsEmbed(character);
      var message = await inputs.message.channel.send({ embed: embed });
      Caches.get("characters").set([character.uid], {
        tallyMessage: message.id,
      });
    });
    await Promise.all(maps2);
  },
};
