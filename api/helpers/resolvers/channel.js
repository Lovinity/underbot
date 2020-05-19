module.exports = {


  friendlyName: 'resolvers.Channel',


  description: 'Resolve a Discord channel mention to a channel object.',


  inputs: {
    mention: {
      type: 'string',
      required: true
    }
  },


  fn: async function (inputs) {
    // Regular Channel support
		const channel = sails.config.custom.discord.regex.channel.test(inputs.mention) ? await DiscordClient.channels.fetch(sails.config.custom.discord.regex.channel.exec(inputs.mention)[1]).catch(() => null) : null;
    if (channel) return channel;
    
		// DM Channel support
		const user = sails.config.custom.discord.regex.userOrMember.test(inputs.mention) ? await DiscordClient.users.fetch(sails.config.custom.discord.regex.userOrMember.exec(inputs.mention)[1]).catch(() => null) : null;
    if (user) return user.createDM();
    
    throw new Error(`Invalid channel: ${inputs.mention}`);
  }


};

