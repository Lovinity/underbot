module.exports = {


  friendlyName: 'events.message',


  description: 'DiscordClient message event',


  inputs: {
    message: {
      type: 'ref',
      required: true,
      description: 'The message object'
    }
  },


  fn: async function (inputs) {
    // Ignore own message
    if (inputs.message.author && inputs.message.author.id === DiscordClient.user.id) return;

    // Reply to DMs saying bot ignores DM messages
    if (!inputs.message.guild && inputs.message.author) {
      inputs.message.author.send(`Oh hi there! Sorry but I don't really have anything to say in DMs. Please talk to me in a guild.`);
      return;
    }

    // If member is supposed to be muted, mute them and delete the message
    if (inputs.message.member && inputs.message.member.settings.muted) {
      if (inputs.message.guild.settings.muteRole && !inputs.message.member.roles.cache.has(inputs.message.guild.settings.muteRole))
        inputs.message.member.roles.add(inputs.message.member.guild.settings.muteRole, `User was supposed to be muted`);
      inputs.message.delete();
      if (inputs.message.member.voice.channel) {
        inputs.member.voice.kick(`User is muted`)
      }
      return;
    }

    // Add spam score
    await sails.helpers.spam.applyMessage(inputs.message);

    // COMMAND

    // Check for a command and execute it if found
    var prefix = inputs.message.guild.settings.prefix || sails.config.custom.discord.defaultPrefix;
    var command;
    var commandParts;

    // Is a command by a guild member who is not a bot? If so, execute it under sails.helpers.commands.
    if (inputs.message.content.startsWith(prefix)) {
      if (inputs.message.member && inputs.message.author && !inputs.message.author.bot) {
        // Each command parameter should be separated by a " | " or a double/triple space in the message.
        // Note: We use double or triple space separation because a Discord mention auto-adds a space at the end, so it's possible the user will add 2 more spaces.
        commandParts = inputs.message.content.replace(prefix, '').split(/(\s{2,3})|(\s\|\s)+/g);
        commandParts = commandParts.filter((part, index) => index % 3 === 0);
        command = commandParts[ 0 ];
        sails.log.debug(`Discord: command executed: ${command}, by ${inputs.message.author.tag}`);
        if (typeof sails.helpers.commands !== 'undefined' && typeof sails.helpers.commands[ command ] !== 'undefined') {
          commandParts[ 0 ] = inputs.message; // The first parameter passed is always the message itself, followed by the user's specified parameters
          try {
            await sails.helpers.commands[ command ](...commandParts);
          } catch (e) { // There was an error in the command
            await sails.helpers.events.error(e);
            inputs.message.reply(`:no_entry: ${e.message}`);
          }
        } else { // Invalid command
          await sails.helpers.events.warn(`Discord: command ${command} does not exist.`);
          inputs.message.reply(':x: Sorry, but that command does not exist');
        }
      }
    } else { // Not a command

      // Message easter eggs

      // Bone reaction
      if (inputs.message.cleanContent && inputs.message.cleanContent.toLowerCase().includes("bone")) {
        inputs.message.react(`🦴`);
      }

      // first Sans attack GIF
      if (inputs.message.cleanContent && inputs.message.cleanContent.toLowerCase().includes("should be burning in hell")) {
        inputs.message.send(`https://vignette4.wikia.nocookie.net/vsbattles/images/0/08/Sans_first_attack.gif/revision/latest?cb=20160203071121`);
      }
    }
  }


};

