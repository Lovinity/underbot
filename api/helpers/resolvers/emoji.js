module.exports = {
  friendlyName: "resolvers.emoji",

  description: "Resolve a Discord emoji mention to an emoji.",

  inputs: {
    mention: {
      type: "string",
      required: true,
    },
  },

  fn: async function (inputs) {
    const emoji = sails.config.custom.discord.regex.emoji.test(inputs.mention)
      ? DiscordClient.emojis.resolve(
          sails.config.custom.discord.regex.emoji.exec(inputs.mention)[1]
        )
      : null;
    if (emoji) return emoji;

    throw new Error(`Invalid emoji: ${inputs.mention}`);
  },
};
