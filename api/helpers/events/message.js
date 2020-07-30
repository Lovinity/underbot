const fs = require("fs");
const path = require("path");

module.exports = {
  friendlyName: "events.message",

  description: "DiscordClient message event",

  inputs: {
    message: {
      type: "ref",
      required: true,
      description: "The message object",
    },
  },

  fn: async function (inputs) {
    // Ignore own message
    if (
      inputs.message.author &&
      inputs.message.author.id === DiscordClient.user.id
    )
      return;

    // Reply to DMs saying bot ignores DM messages
    if (!inputs.message.guild && inputs.message.author) {
      inputs.message.author.send(
        `Oh hi there! Sorry but I don't really have anything to say in DMs. Please talk to me in a guild.`
      );
      return;
    }

    // If member is supposed to be muted, mute them and delete the message
    if (inputs.message.member && inputs.message.member.settings.muted) {
      if (
        inputs.message.guild.settings.muteRole &&
        !inputs.message.member.roles.cache.has(
          inputs.message.guild.settings.muteRole
        )
      )
        inputs.message.member.roles.add(
          inputs.message.member.guild.settings.muteRole,
          `User was supposed to be muted`
        );
      inputs.message.delete();
      if (inputs.message.member.voice.channel) {
        inputs.member.voice.kick(`User is muted`);
      }
      return;
    }

    // Add spam score
    await sails.helpers.spam.applyMessage(inputs.message);

    // COMMAND

    // Check for a command and execute it if found
    var prefix =
      inputs.message.guild.settings.prefix ||
      sails.config.custom.discord.defaultPrefix;
    var command;
    var commandParts;

    // Is a command by a guild member who is not a bot? If so, execute it under sails.helpers.commands.
    if (inputs.message.content.startsWith(prefix)) {
      if (
        inputs.message.member &&
        inputs.message.author &&
        !inputs.message.author.bot
      ) {
        // Each command parameter should be separated by a " | " or a double/triple space in the message.
        // Note: We use double or triple space separation because a Discord mention auto-adds a space at the end, so it's possible the user will add 2 more spaces.
        commandParts = inputs.message.content
          .replace(prefix, "")
          .split(/(\s{2,3})|(\s\|\s)+/g);
        commandParts = commandParts.filter((part, index) => index % 3 === 0);
        command = commandParts[0];
        sails.log.debug(
          `Discord: command executed: ${command}, by ${inputs.message.author.tag}`
        );
        if (
          typeof sails.helpers.commands !== "undefined" &&
          typeof sails.helpers.commands[command] !== "undefined"
        ) {
          commandParts[0] = inputs.message; // The first parameter passed is always the message itself, followed by the user's specified parameters
          try {
            await sails.helpers.commands[command](...commandParts);
          } catch (e) {
            // There was an error in the command
            await sails.helpers.events.error(e);

            // Return an error message
            const errorMessage = new Discord.MessageEmbed()
              .setTitle(`❌ An error has occurred while executing ${command}.`)
              .setDescription(`${e.message}\n\u200b`)
              .setColor(`#ee110f`)
              .setThumbnail(
                `https://cdn.discordapp.com/emojis/604486986170105866.png?v=1`
              );
            inputs.message.channel
              .send(errorMessage)
              .then((a) => a.delete({ timeout: 30000 }));
          }
        } else {
          // Invalid command
          await sails.helpers.events.warn(
            `Discord: command ${command} does not exist.`
          );

          // Return an error message
          const errorMessage = new Discord.MessageEmbed()
            .setTitle(`❌ The command ${command} does not exist.`)
            .setDescription(
              `Remember that command parameters must be separated with " | " or double spaces`
            )
            .setColor(`#ee110f`)
            .setThumbnail(
              `https://cdn.discordapp.com/emojis/604486986170105866.png?v=1`
            );
          inputs.message.channel
            .send(errorMessage)
            .then((a) => a.delete({ timeout: 15000 }));
        }
      }
    } else {
      // Not a command

      // RP post?
      var categories = [
        "710408355373383772", // ruins
        "710413557333884948", // snowdin
        "710413584772890685", // waterfall
        "710413617073487914", // Hotlands
        "710413931885363253", // Core
        "710413972385431633", // New home
        "711099427770728449", // Undernet
      ];

      if (
        inputs.message.channel.parent &&
        categories.indexOf(inputs.message.channel.parent.id) !== -1
      ) {
        if (
          inputs.message.author &&
          inputs.message.cleanContent &&
          !inputs.message.cleanContent.startsWith("(") &&
          !inputs.message.cleanContent.startsWith("/") &&
          inputs.message.cleanContent.length >= 128
        ) {
          Caches.get("members").set(
            [inputs.message.author.id, inputs.message.guild.id],
            {
              rpPosts:
                inputs.message.author.guildSettings(inputs.message.guild.id)
                  .rpPosts + 1,
            }
          );
        }
      }

      // Message easter eggs

      // Death counter
      if (
        inputs.message.cleanContent &&
        inputs.message.author &&
        inputs.message.guild &&
        (inputs.message.cleanContent.toLowerCase().includes("*dies*") ||
          inputs.message.cleanContent.toLowerCase().includes("dies*") ||
          inputs.message.cleanContent.toLowerCase().includes("*dies") ||
          inputs.message.cleanContent.toLowerCase().includes("_dies") ||
          inputs.message.cleanContent.toLowerCase().includes("dies_") ||
          inputs.message.cleanContent.toLowerCase().includes("*died") ||
          inputs.message.cleanContent.toLowerCase().includes("_died") ||
          inputs.message.cleanContent
            .toLowerCase()
            .includes("asterisk dies asterisk") ||
          inputs.message.cleanContent
            .toLowerCase()
            .includes("**asterisk dies asterisk**") ||
          inputs.message.cleanContent.toLowerCase().includes("kills me") ||
          inputs.message.cleanContent.toLowerCase().includes("killing me") ||
          inputs.message.cleanContent.toLowerCase().includes("*perishes") ||
          inputs.message.cleanContent.toLowerCase().includes("perishes*") ||
          inputs.message.cleanContent.toLowerCase().includes("_perishes") ||
          inputs.message.cleanContent.toLowerCase().includes("perishes_") ||
          inputs.message.cleanContent.toLowerCase().includes("*has bad time") ||
          inputs.message.cleanContent.toLowerCase().includes("has bad time*") ||
          inputs.message.cleanContent.toLowerCase().includes("_has bad time") ||
          inputs.message.cleanContent.toLowerCase().includes("has bad time_") ||
          inputs.message.cleanContent.toLowerCase().includes("*stops living") ||
          inputs.message.cleanContent.toLowerCase().includes("stops living*") ||
          inputs.message.cleanContent.toLowerCase().includes("_stops living") ||
          inputs.message.cleanContent.toLowerCase().includes("stops living_") ||
          inputs.message.cleanContent
            .toLowerCase()
            .includes("*has a bad time") ||
          inputs.message.cleanContent
            .toLowerCase()
            .includes("has a bad time*") ||
          inputs.message.cleanContent
            .toLowerCase()
            .includes("_has a bad time") ||
          inputs.message.cleanContent
            .toLowerCase()
            .includes("has a bad time_") ||
          inputs.message.cleanContent.toLowerCase().includes("*disappears") ||
          inputs.message.cleanContent.toLowerCase().includes("_disappears"))
      ) {
        Caches.get("members").set(
          [inputs.message.author.id, inputs.message.guild.id],
          {
            deathCount:
              inputs.message.author.guildSettings(inputs.message.guild.id)
                .deathCount + 1,
          }
        );
        inputs.message.channel.send(
          `**Uh oh!** <@${
            inputs.message.author.id
          }> died again! Death counter: **${
            inputs.message.author.guildSettings(inputs.message.guild.id)
              .deathCount
          }**`
        );
      }

      // Bone reaction
      if (
        inputs.message.cleanContent &&
        inputs.message.cleanContent.toLowerCase().includes("bone")
      ) {
        inputs.message.react(`🦴`);
      }

      // Leg reaction to darling
      if (
        inputs.message.cleanContent &&
        inputs.message.cleanContent.toLowerCase().includes("darling")
      ) {
        inputs.message.react(`🦿`);
      }

      // Vomit reaction to babe
      if (
        inputs.message.cleanContent &&
        inputs.message.cleanContent.toLowerCase().includes("babe")
      ) {
        inputs.message.react(`🤮`);
      }

      // first Sans attack GIF
      if (
        inputs.message.cleanContent &&
        inputs.message.cleanContent
          .toLowerCase()
          .includes("should be burning in hell")
      ) {
        inputs.message.send({
          files: [
            fs.readFileSync(
              path.resolve(
                __dirname,
                "../../../assets/images/sans_first_attack.gif"
              )
            ),
          ],
        });
      }
    }
  },
};
