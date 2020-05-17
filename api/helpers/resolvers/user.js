module.exports = {


  friendlyName: 'resolvers.user',


  description: 'Resolve a mention to a Discord user.',


  inputs: {
    mention: {
      type: 'string',
      required: true
    }
  },


  fn: async function (inputs) {
    const user = sails.config.custom.discord.regex.userOrMember.test(inputs.mention) ? await DiscordClient.users.fetch(sails.config.custom.discord.regex.userOrMember.exec(inputs.mention)[1]).catch(() => null) : null;
		if (user) return user;
    
    throw `Invalid user: ${inputs.mention}`
  }


};

