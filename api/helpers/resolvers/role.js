module.exports = {


  friendlyName: 'resolvers.role',


  description: 'Resolve a role mention to a Discord role in the guild.',


  inputs: {
    message: {
      type: 'ref',
      required: true
    },
    mention: {
      type: 'string',
      required: true
    }
  },


  fn: async function (inputs) {
    const role = sails.config.custom.discord.regex.role.test(inputs.mention) ? await inputs.message.guild.roles.fetch(sails.config.custom.discord.regex.role.exec(inputs.mention)[1]) : null;
		if (role) return role;
    
    throw new Error(`Invalid role: ${inputs.mention}. Remember, bot can only resolve roles from the same guild.`);
  }


};

