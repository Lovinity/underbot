module.exports = {


  friendlyName: 'events.guildCreate',


  description: 'Discord guild create event',


  inputs: {
    guild: {
      type: 'ref',
      required: true,
      description: 'The guild created'
    }
  },


  fn: async function (inputs) {
    if (!inputs.guild.available)
      return;
    if (sails.config.custom.discord.guildBlacklist.includes(inputs.guild.id)) {
      inputs.guild.leave();
      await sails.helpers.events.warn(`Blacklisted guild detected: ${inputs.guild.name} [${inputs.guild.id}]`);
      return;
    }
  }


};

