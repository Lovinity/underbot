/**
 * Seed Function
 * (sails.config.bootstrap)
 *
 * A function that runs just before your Sails app gets lifted.
 * > Need more flexibility?  You can also create a hook.
 *
 * For more information on seeding your app with fake data, check out:
 * https://sailsjs.com/config/bootstrap
 */

global[ 'Discord' ] = require('discord.js');
var CacheManager = require('../util/Cache');
global[ 'Caches' ] = new CacheManager();
global[ 'moment' ] = require('moment');
require('moment-duration-format');

module.exports.bootstrap = async function () {

  /*
      CACHES AND STRUCTURES
  */

  Caches.new('guilds', [ 'guildID' ]);
  Caches.new('characters', [ 'uid' ]);
  Discord.Structures.extend('Guild', Guild => {
    class CoolGuild extends Guild {
      constructor(client, data) {
        super(client, data);

        // Initialize the guild in the cache
        Caches.get('guilds').find([ this.id ]);
      }

      get settings () {
        return Caches.get('guilds').find([ this.id ]);
      }

      get characters () {
        return Caches.get('characters').collection.filter((record) => record.guildID === this.id);
      }
    }

    return CoolGuild;
  });



  /*
      DISCORD
  */

  // Load Discord globals and initialize Discord client
  Discord.DiscordMenu = require('../util/DiscordMenu');
  global[ 'DiscordClient' ] = new Discord.Client(sails.config.custom.discord.clientOptions);

  // Initialize DiscordClient event handlers
  if (sails.helpers.events) {
    for (var event in sails.helpers.events) {
      if (Object.prototype.hasOwnProperty.call(sails.helpers.events, event)) {

        // Needs to be in a self-calling function to provide the proper value of event
        (async (event2) => {
          if ([ 'ready' ].indexOf(event2) !== -1) {
            DiscordClient.once(event2, async (...args) => {
              await sails.helpers.events[ event2 ](...args);
            })
          } else {
            DiscordClient.on(event2, async (...args) => {
              await sails.helpers.events[ event2 ](...args);
            })
          }
        })(event);

      }
    }
  }

  // Start the Discord bot
  DiscordClient.login(sails.config.custom.discord.token);

};
