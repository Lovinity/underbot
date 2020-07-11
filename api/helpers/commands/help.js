module.exports = {
  friendlyName: "commands.help",

  description: "Get information about the available commands in the bot.",

  inputs: {
    message: {
      type: "ref",
      required: true,
      description: "The message that triggered the command",
    },
    command: {
      type: "string",
      description:
        "Specify a specific command to get extended help on that command, including parameters.",
    },
  },

  exits: {},

  fn: async function (inputs) {
    var guildSettings = await inputs.message.guild.settings();
    var prefix =
      guildSettings.prefix || sails.config.custom.discord.defaultPrefix;

    // Get info about a specific command
    var commandHelp = async (command) => {
      var info = sails.helpers.commands[command].toJSON();
      var embed = new Discord.MessageEmbed()
        .setAuthor(
          `Drago's Moderation - Help`,
          `${Client.user.displayAvatarURL()}`
        )
        .setTitle(`Bot Command ${prefix}${command}`)
        .setDescription(info.description)
        .setColor(`#8800FF`)
        .addField(
          `Parameters (separate each with a " | " or a double space)`,
          "."
        )
        .setFooter(
          `Help was requested by ${inputs.message.author.username}`,
          `${inputs.message.author.displayAvatarURL({ dynamic: "true" })}`
        );

      for (var input in info.inputs) {
        if (
          input !== "message" &&
          Object.prototype.hasOwnProperty.call(info.inputs, input)
        ) {
          var value = info.inputs[input].required ? `**REQUIRED**` + "\n" : `OPTIONAL` + "\n";
          value += `Type: ${info.inputs[input].type}` + "\n";
          if (info.inputs[input].isInteger) value += `Integer.` + "\n";
          if (info.inputs[input].isCreditCard)
            value += `Credit Card Number.` + "\n";
          if (info.inputs[input].isEmail) value += `Email Address.` + "\n";
          if (info.inputs[input].isHexColor)
            value += `Hexadecimal Color.` + "\n";
          if (info.inputs[input].isIP) value += `IP address.` + "\n";
          if (info.inputs[input].isURL) value += `URL.` + "\n";
          if (info.inputs[input].isUUID) value += `UUID.` + "\n";
          if (info.inputs[input].regex)
            value += `Regex: ${info.inputs[input].regex}` + "\n";
          if (typeof info.inputs[input].custom !== "undefined")
            value += `Property also has custom validation.` + "\n";
          if (typeof info.inputs[input].isBefore !== "undefined") {
            value +=
              `Before Date: ${moment(info.inputs[input].isBefore).format()}` +
              "\n";
          }
          if (typeof info.inputs[input].isAfter !== "undefined") {
            value +=
              `After Date: ${moment(info.inputs[input].isAfter).format()}` +
              "\n";
          }
          if (
            typeof info.inputs[input].defaultsTo !== "undefined" ||
            info.inputs[input].allowNull
          )
            value +=
              `Default Value: ${
                typeof info.inputs[input].defaultsTo !== "undefined"
                  ? info.inputs[input].defaultsTo
                  : `null`
              }` + "\n";
          if (typeof info.inputs[input].isIn !== "undefined")
            value +=
              `Must be one of the following: [${info.inputs[input].isIn.join(
                ", "
              )}]` + "\n";
          if (typeof info.inputs[input].isNotIn !== "undefined")
            value +=
              `Must NOT be one of the following: [${info.inputs[
                input
              ].isNotIn.join(", ")}]` + "\n";
          if (typeof info.inputs[input].min !== "undefined")
            value += `Minimum: ${info.inputs[input].min}` + "\n";
          if (typeof info.inputs[input].max !== "undefined")
            value += `Maximum: ${info.inputs[input].max}` + "\n";
          if (typeof info.inputs[input].minLength !== "undefined")
            value +=
              `Minimum length: ${info.inputs[input].minLength} characters` +
              "\n";
          if (typeof info.inputs[input].maxLength !== "undefined")
            value +=
              `Maximum length: ${info.inputs[input].maxLength} characters` +
              "\n";
          value += info.inputs[input].description + "\n";

          embed.addField(input, value);
        }
      }

      return inputs.message.channel.send({ embed: embed });
    };

    // No command specified? Get general info about all commands
    if (!inputs.command) {
      let commandsMain = [];
      let commands = [];
      let _commands = [];
      let commands2 = [];

      // Get all the commands
      for (var command in sails.helpers.commands) {
        if (
          Object.prototype.hasOwnProperty.call(sails.helpers.commands, command)
        ) {
          commands.push(command);
          commandsMain.push(command);
        }
      }

      // Now, break the commands up into groups of 10 for pagination.
      while (commands.length > 0) {
        _commands.push(commands.shift());
        if (_commands.length > 9) {
          commands2.push(_.cloneDeep(_commands));
          _commands = [];
        }
      }
      if (_commands.length > 0) {
        commands2.push(_.cloneDeep(_commands));
      }

      // Construct the Discord Menu
      return new Discord.DiscordMenu(
        inputs.message.channel,
        inputs.message.author.id,
        commands2.map((group) => {
          var groupEmbed = new Discord.MessageEmbed()
            .setAuthor(
              `Drago's Moderation - Help`,
              `${Client.user.displayAvatarURL()}`
            )
            .setDescription(
              `Here is a list of available commands in the bot ( use the prefix **${prefix}** at the beginning of a command name to execute it ). Use the reactions to scroll between pages. Type a command name to view more info about that command.`
            )
            .setColor(`#8800FF`)
            .setFooter(
              `Help was requested by ${inputs.message.author.username}`,
              `${inputs.message.author.displayAvatarURL({ dynamic: "true" })}`
            );
          group.map((cmd) => {
            groupEmbed.addField(
              cmd,
              sails.helpers.commands[cmd].toJSON().description
            );
          });
          return groupEmbed;
        }),
        commandsMain.map((cmd) => {
          return {
            message: cmd,
            fn: (senderMessage) => {
              senderMessage.delete();
              return commandHelp(cmd);
            },
          };
        })
      );
    } else {
      return commandHelp(inputs.command);
    }
  },
};
