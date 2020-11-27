const { Client } = require("discord.js");

module.exports = {
  friendlyName: "commands.rpPost",

  description: "Recalculate the number of RP posts every member has made.",

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

    var mg = await inputs.message.send(
      `:hourglass: Please wait; this could take a while... (generating list of channels to fetch messages)`
    );

    // Set up a prompt function
    var prompt = async (
      prompt,
      time,
      remove = true,
      filter = message => message.author.id === inputs.message.author.id
    ) => {
      // Prompt message
      var msg = await inputs.message.send(prompt);

      // Collect a response message
      try {
        var response = await inputs.message.channel.awaitMessages(filter, {
          max: 1,
          time: time,
          errors: ["time"]
        });
      } catch (e) {
        throw new Error(`newcharacter command timed out.`);
      }

      // Delete sent message if remove is true
      if (remove) response.first().delete();

      response = response.first();

      // Cancel command if cancel was provided
      if (response.cleanContent.toLowerCase() === "cancel") {
        throw new Error(`Command was canceled.`);
      }

      // Delete prompt message
      msg.delete();

      return response;
    };

    var categories = [
      "710408355373383772", // ruins
      "710413557333884948", // snowdin
      "710413584772890685", // waterfall
      "710413617073487914", // Hotlands
      "710413931885363253", // Core
      "710413972385431633", // New home
      "711099427770728449" // Undernet
    ];

    var tuppers = {};

    var channels = inputs.message.guild.channels.cache
      .array()
      .filter(
        channel =>
          channel.parentID &&
          categories.indexOf(channel.parentID) !== -1 &&
          channel.type === "text"
      );

    var index = 0;

    var messages = [];

    var afterSnowflake = `299263042967830548`;
    var currentSnowflake;

    var channel;

    var compare = (a, b) => {
      return a.id - b.id;
    };
    var compareReverse = (a, b) => {
      return b.id - a.id;
    };

    var nextChannel = async () => {
      sails.log.debug(`nextChannel index ${index}`);
      if (index >= channels.length) return;

      if (!channels[index]) {
        sails.log.debug(`Channel not found`);
        index++;
        await nextChannel();
      }

      sails.log.debug(`nextChannel channel name ${channels[index].name}`);

      await mg.edit(
        `:hourglass: Please wait; this could take a while... (Fetching messages from channel ${index +
          1}/${channels.length} [${
          channels[index].parent ? `${channels[index].parent} => ` : ``
        }${channels[index].name}])`
      );

      currentSnowflake = afterSnowflake;

      await nextMessageBatch();
    };

    var splitMessages = () => {
      return new Promise(async (resolve, reject) => {
        setTimeout(async () => {
          var msgs = messages.splice(0, 100);

          var maps = msgs.filter(
            message =>
              message.cleanContent &&
              !message.cleanContent.startsWith("(") &&
              !message.cleanContent.startsWith("/") &&
              message.cleanContent.length >= 128
          );
          for (let message of maps) {
            if (!message.author) continue;
            if (!message.author.bot) {
              let guildSettings = await message.author.guildSettings(
                inputs.message.guild.id
              );
              await sails.models.members.updateOne(
                { userID: message.author.id, guildID: message.guild.id },
                { rpPosts: guildSettings.rpPosts + 1 }
              );
            } else {
              if (tuppers[message.author.tag]) {
                let guildSettings = await tuppers[
                  message.author.tag
                ].guildSettings(inputs.message.guild.id);
                await sails.models.members.updateOne(
                  {
                    userID: tuppers[message.author.tag].id,
                    guildID: tuppers[message.author.tag].guild.id
                  },
                  { rpPosts: guildSettings.rpPosts + 1 }
                );
              } else {
                var promptMsg = await prompt(
                  `<@${inputs.message.author.id}>, Please provide the snowflake ID of the member who uses the bot/tupper ${message.author.tag}.`,
                  300000
                );
                var member = await inputs.message.guild.members.fetch(
                  promptMsg.cleanContent
                );
                if (member) {
                  tuppers[message.author.tag] = member.user;
                  let guildSettings = await member.settings();
                  await sails.models.members.updateOne(
                    { userID: member.id, guildID: message.guild.id },
                    { rpPosts: guildSettings.rpPosts + 1 }
                  );
                } else {
                  var user = await DiscordClient.users.fetch(
                    promptMsg.cleanContent
                  );
                  if (user) {
                    tuppers[message.author.tag] = user;
                    let guildSettings = await user.guildSettings(
                      inputs.message.guild.id
                    );
                    await sails.models.members.updateOne(
                      { userID: user.id, guildID: message.guild.id },
                      { rpPosts: guildSettings.rpPosts + 1 }
                    );
                  } else {
                    inputs.message.channel.send(`:x: failed`);
                  }
                }
              }
            }
          }

          if (messages.length > 0) await splitMessages();

          return resolve();
        }, 3000);
      });
    };

    var nextMessageBatch = () => {
      return new Promise(async (resolve, reject) => {
        setTimeout(async () => {
          sails.log.debug(
            `nextMessageBatch after snowflake ${currentSnowflake}`
          );
          var msg = await channels[index].messages.fetch(
            { after: currentSnowflake },
            false
          );
          if (!msg || msg.size === 0) {
            sails.log.debug(`nextMessageBatch: no more messages`);
            await mg.edit(
              `:hourglass: Please wait; this could take a while... (Processing ${
                messages.length
              } messages from channel ${index + 1}/${channels.length} [${
                channels[index].parent ? `${channels[index].parent} => ` : ``
              }${channels[index].name}])`
            );
            messages = messages.sort(compare);
            await splitMessages();
            index++;
            await nextChannel();
            return resolve();
          } else {
            sails.log.debug(`nextMessageBatch: got ${msg.size} messages.`);
            msg = msg.array();
            msg = msg.sort(compareReverse);
            messages = messages.concat(msg);
            currentSnowflake = msg[0].id;
            await nextMessageBatch();
            return resolve();
          }
        }, 3000);
      });
    };

    await nextChannel();

    await mg.edit(`DONE!`);
  }
};
