module.exports = {
  friendlyName: "guild.send",

  description: "Post something in a Discord guild channel.",

  inputs: {
    type: {
      type: "string",
      required: true,
      description: "The guild settings channel key to post in.",
    },
    guild: {
      type: "ref",
      required: true,
      description: "The guild object",
    },
    content: {
      type: "string",
      description: "Content string to post",
    },
    options: {
      type: "ref",
      description:
        "Additional options, such as embeds, to pass to the message.",
    },
  },

  fn: async function (inputs) {
    if (!inputs.guild.settings[inputs.type]) return;

    var channel = inputs.guild.channels.resolve(
      inputs.guild.settings[inputs.type]
    );
    if (!channel) {
      await sails.helpers.events.warn(
        `Tried to send a message in the ${inputs.type} of ${inputs.guild.id}, but the channel does not exist.`
      );
      return;
    }

    return await channel.send(inputs.content, inputs.options);
  },
};
