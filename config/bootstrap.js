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

// Load discord
global[ 'Discord' ] = require('discord.js');

// Load cache manager class
var CacheManager = require('../util/Cache');
global[ 'Caches' ] = new CacheManager();

// Load moment model for date/time manipulation and processing
global[ 'moment' ] = require('moment');
require('moment-duration-format');

module.exports.bootstrap = async function () {

  /*
      INIT CACHES AND STRUCTURES
  */

  // Guilds
  Caches.new('guilds', [ 'guildID' ]);
  Caches.new('characters', [ 'uid' ]);
  Discord.Structures.extend('Guild', Guild => {
    class CoolGuild extends Guild {
      constructor(client, data) {
        super(client, data);

        // Initialize the guild in the cache
        Caches.get('guilds').find([ this.id ]);
      }

      // per-guild settings
      get settings () {
        return Caches.get('guilds').find([ this.id ]);
      }

      // per-guild characters for dialog command
      get characters () {
        return Caches.get('characters').collection.filter((record) => record.guildID === this.id);
      }
    }

    return CoolGuild;
  });

  // Messages
  Discord.Structures.extend('Message', Message => {
    class CoolMessage extends Message {
      constructor(client, data, channel) {
        super(client, data, channel);

        this._responses = [];
      }

      // Taken from Klasa.js
      get responses () {
        return this._responses.filter(msg => !msg.deleted);
      }

      // Taken from Klasa.js
      async send (content, options) {
        const combinedOptions = Discord.APIMessage.transformOptions(content, options);

        if ('files' in combinedOptions) return this.channel.send(combinedOptions);

        const newMessages = new Discord.APIMessage(this.channel, combinedOptions).resolveData().split()
          .map(mes => {
            // Command editing should always remove embeds and content if none is provided
            mes.data.embed = mes.data.embed || null;
            mes.data.content = mes.data.content || null;
            return mes;
          });

        const { responses } = this;
        const promises = [];
        const max = Math.max(newMessages.length, responses.length);

        for (let i = 0; i < max; i++) {
          if (i >= newMessages.length) responses[ i ].delete();
          else if (responses.length > i) promises.push(responses[ i ].edit(newMessages[ i ]));
          else promises.push(this.channel.send(newMessages[ i ]));
        }

        const newResponses = await Promise.all(promises);

        return newResponses.length === 1 ? newResponses[ 0 ] : newResponses;
      }

    }

    return CoolMessage;
  });



  /*
      DISCORD
  */

  // Load Discord globals and initialize Discord client
  Discord.DiscordMenu = require('../util/DiscordMenu');
  global[ 'DiscordClient' ] = new Discord.Client(sails.config.custom.discord.clientOptions);

  // Initialize DiscordClient event handlers (every Discord.js event is handled in a sails.helpers.events file)
  if (sails.helpers.events) {
    for (var event in sails.helpers.events) {
      if (Object.prototype.hasOwnProperty.call(sails.helpers.events, event)) {

        // Needs to be in a self-calling function to provide the proper value of event
        let temp = (async (event2) => {
          // ready should only ever fire once whereas other events should be allowed to fire multiple times.
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
