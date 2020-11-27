module.exports = {
  friendlyName: "commands.cStatsChannel",

  description:
    "Execute this command in the text channel you want the bot to post and manage real-time stats for each character in the database. (staff-only command)",

  inputs: {
    message: {
      type: "ref",
      required: true,
      description: "The message that triggered the command"
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
    if (guildSettings.characterStatsChannel) {
      var channel = await inputs.message.guild.channels.resolve(
        guildSettings.characterStatsChannel
      );
      if (channel) {
        var maps = guildCharacters.map(async character => {
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
    await sails.helpers.guilds.updateOne(
      { guildID: inputs.message.guild.id },
      { characterStatsChannel: inputs.message.channel.id }
    );

    // Loop through each character in the database and create a stats message
    var maps2 = guildCharacters.map(async character => {
      var embed = await sails.helpers.characters.generateStatsEmbed(character);
      var message = await inputs.message.channel.send({ embed: embed });
      await sails.models.characters.updateOne(
        { uid: character.uid },
        { tallyMessage: message.id }
      );
    });
    await Promise.all(maps2);
  }
};
