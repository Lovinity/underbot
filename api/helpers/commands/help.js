module.exports = {


  friendlyName: 'commands.help',


  description: 'Get information about the available commands in the bot.',


  inputs: {
    message: {
      type: 'ref',
      required: true,
      description: 'The message that triggered the command'
    },
    command: {
      type: 'string',
      description: 'Specify a specific command to get extended help on that command, including parameters.'
    },
  },


  exits: {

  },


  fn: async function (inputs) {
    var prefix = inputs.message.guild.settings.prefix || sails.config.custom.discord.defaultPrefix;
    var children = [];

    // Get info about a specific command
    var commandHelp = async (command) => {
      var info = sails.helpers.commands[ command ].toJSON();
      var embed = new Discord.MessageEmbed()
        .setTitle(`Bot Command ${prefix}${command}`)
        .setDescription(info.description)
        .addField(`Parameters (separate each with a " | " or a double space)`, '.');

      for (var input in info.inputs) {
        if (input !== 'message' && Object.prototype.hasOwnProperty.call(info.inputs, input)) {
          var value = info.inputs[ input ].required ? `**REQUIRED**` + "\n" : ``;
          value += `Type: ${info.inputs[ input ].type}` + "\n";
          if (typeof info.inputs[ input ].min !== 'undefined')
            value += `Minimum: ${info.inputs[ input ].min}` + "\n"
          if (typeof info.inputs[ input ].max !== 'undefined')
            value += `Maximum: ${info.inputs[ input ].max}` + "\n"
          if (typeof info.inputs[ input ].minLength !== 'undefined')
            value += `Minimum length: ${info.inputs[ input ].minLength} characters` + "\n"
          if (typeof info.inputs[ input ].maxLength !== 'undefined')
            value += `Maximum length: ${info.inputs[ input ].maxLength} characters` + "\n"
          value += info.inputs[ input ].description + "\n";

          embed.addField(input, value);
        }
      }

      return inputs.message.send({ embed: embed });
    }

    // No command specified? Get general info about all commands
    if (!inputs.command) {

      // Generate the menu items / commands
      for (var command in sails.helpers.commands) {
        if (Object.prototype.hasOwnProperty.call(sails.helpers.commands, command)) {
          let tmp = ((cmd) => {
            children.push({
              title: `${prefix}${cmd}`,
              description: sails.helpers.commands[ cmd ].toJSON().description,
              function: (outputMessage, senderMessage) => {
                outputMessage.delete();
                return commandHelp(cmd);
              }
            });
          })(command);
        }
      }

      // Construct the menu
      var menuTemplate = {
        title: `Available Bot Commands`,
        description: `Here is a list of available commands in this bot. For more information about a specific command, choose its number in the menu.`,
        color: "YELLOW",
        children: children
      };
      var response = await inputs.message.reply(`Please wait...`);
      const menu = new Discord.DiscordMenu(menuTemplate, response, inputs.message, {
        backButton: true,
        time: 180
      });
      menu.start();
    } else {
      return commandHelp(inputs.command);
    }
  }


};

