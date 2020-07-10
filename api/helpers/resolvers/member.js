module.exports = {
  friendlyName: "resolvers.member",

  description: "Resolve a mention to a guild member.",

  inputs: {
    message: {
      type: "ref",
      required: true,
    },
    mention: {
      type: "string",
      required: true,
    },
  },

  fn: async function (inputs) {
    const member = sails.config.custom.discord.regex.userOrMember.test(
      inputs.mention
    )
      ? await inputs.message.guild.members
          .fetch(
            sails.config.custom.discord.regex.userOrMember.exec(
              inputs.mention
            )[1]
          )
          .catch(() => null)
      : null;
    if (member) return member;

    throw new Error(
      `Invalid member: ${inputs.mention}. Remember, members must exist in the guild.`
    );
  },
};
