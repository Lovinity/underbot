module.exports = {


  friendlyName: 'sails.helpers.events.ready',


  description: 'DiscordClient ready event.',


  inputs: {
  },


  fn: async function (inputs) {
    sails.log.debug(`Discord is ready!`);


    // Send a message to the owner in DM telling them the bot was started.
    if (sails.config.custom.discord.clientOwner) {
      var owner = DiscordClient.users.resolve(sails.config.custom.discord.clientOwner);
      if (owner) {
        owner.send(`:arrows_counterclockwise: The bot has been rebooted.`);
      }
    }

    // Iterate through all cached guilds
    DiscordClient.guilds.cache.each(async (guild) => {

      // Kick self if the guild is black listed
      if (!guild.available)
        return;
      if (sails.config.custom.discord.guildBlacklist.includes(guild.id)) {
        guild.leave();
        sails.log.warn(`Blacklisted guild detected: ${guild.name} [${guild.id}]. Bot left.`);
        return;
      }

    });

    for (var i = 0; i < 10; i++) {
      Caches.get('characters').set([ `i_${i}` ], { name: `n_${i}`, guildID: `STUFF` });
    }

    for (var i = 0; i < 10; i++) {
      Caches.get('characters').set([ `i_${i}` ], { name: `n2_${i}`, guildID: `STUFF` });
    }
  }

};

