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

// Schedules cache
global[ 'Schedules' ] = {};

// Load moment model for date/time manipulation and processing
global[ 'moment' ] = require('moment');
require('moment-duration-format');

const stringSimilarity = require("string-similarity");

module.exports.bootstrap = async function () {

  /*
      INIT CACHES AND STRUCTURES
  */

  // Guilds
  await Caches.new('guilds', [ 'guildID' ]);
  await Caches.new('characters', [ 'uid' ]);
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

      // per-guild characters
      get characters () {
        return Caches.get('characters').collection.filter((record) => record.guildID === this.id);
      }
    }

    return CoolGuild;
  });

  // GuildMember
  await Caches.new('members', [ 'userID', 'guildID' ]);
  Discord.Structures.extend('GuildMember', GuildMember => {
    class CoolGuildMember extends GuildMember {
      constructor(client, data, guild) {
        super(client, data, guild);

        // Initialize the guild member in the cache
        Caches.get('members').find([ this.id, this.guild.id ]);
      }

      // Per-member settings
      get settings () {
        return Caches.get('members').find([ this.id, this.guild.id ]);
      }

      // Per-member characters they own
      get characters () {
        return Caches.get('characters').collection.filter((record) => record.userID === this.id);
      }
    }

    return CoolGuildMember;
  });

  // Messages
  Discord.Structures.extend('Message', Message => {
    class CoolMessage extends Message {
      constructor(client, data, channel) {
        super(client, data, channel);

        this._responses = [];
        this.cachedSpamScore = null;
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

      get spamScore () {
        if (this.cachedSpamScore !== null)
          return this.cachedSpamScore;

        if (this.type !== 'DEFAULT') {
          this.cachedSpamScore = 0;
          return 0;
        }

        // Start with a base score of 2
        var score = 2;
        var scoreReasons = {};

        // Add 5 score for each mention; mention spam
        var nummentions = this.mentions.users.size + this.mentions.roles.size;
        score += (5 * nummentions);
        if (nummentions > 0) { scoreReasons[ "Mentions" ] = (nummentions * 5) }

        // Add 5 score for each embed; link/embed spam
        var numembeds = this.embeds.length;
        score += (5 * numembeds);
        if (numembeds > 0) { scoreReasons[ "Embeds" ] = (numembeds * 5) }

        // Add 10 score for each attachment; attachment spam
        var numattachments = this.attachments.size;
        score += (10 * numattachments);
        if (numattachments > 0) { scoreReasons[ "Attachments" ] = (numattachments * 10) }

        // Calculate how many seconds this message took to type based off of 14 characters per second.
        var messageTime = ((this.cleanContent ? this.cleanContent.length : 0) / 14);

        // Iterate through messages of this channel from the last 3 minutes by the same author
        var collection = this.channel.messages.cache
          .filter((message) => {
            if (message.partial || message === null || !message) return false;
            return message.id !== this.id && message.author.id === this.author.id && moment(this.createdAt).subtract(3, 'minutes').isBefore(moment(message.createdAt)) && moment(this.createdAt).isAfter(moment(message.createdAt));
          });

        collection.each((message) => {
          // If the current message was sent at a time that causes the typing speed to be more than 14 characters per second, 
          // add score for flooding / copypasting. The faster / more characters typed, the more score added.
          var timediff = moment(this.createdAt).diff(moment(message.createdAt), 'seconds');
          if (timediff <= messageTime && !this.author.bot) {
            score += parseInt((messageTime - timediff) + 1);
            scoreReasons[ "Flooding / Rapid Typing" ] = parseInt((messageTime - timediff) + 1)
          }

          // If the current message is more than 80% or more similar to the comparing message, 
          // add 1 score for every (similarity % - 80) / 2; copy/paste spam. Multiply by 1 + (0.1 * (numcharacters / 100))
          var similarity = stringSimilarity.compareTwoStrings(`${this.content || ''}${JSON.stringify(this.embeds)}${JSON.stringify(this.attachments.array())}`, `${message.content || ''}${JSON.stringify(message.embeds)}${JSON.stringify(message.attachments.array())}`);
          if (similarity >= 0.8) {
            score += parseInt((10 - ((1 - similarity) * 50)) * (1 + (0.1 * (this.cleanContent ? this.cleanContent.length / 100 : 0))));
            scoreReasons[ "Copy-Pasting" ] = parseInt((10 - ((1 - similarity) * 50)) * (1 + (0.1 * (this.cleanContent ? this.cleanContent.length / 100 : 0))))
          }
        });

        // Score checks only if message content exists
        if (this.cleanContent && this.cleanContent.length > 0) {

          /* DISABLED; many false positives for emojis etc
          // If the message contains any off-the-wall characters, consider it spam and add 10 to the score.
          if (/[^\x20-\x7E]/g.test(this.cleanContent || '')) {
              score += 10;
              console.log(`special characters: 10`);
          }
          */

          // Count uppercase and lowercase letters
          var uppercase = this.cleanContent.replace(/[^A-Z]/g, "").length;
          var lowercase = this.cleanContent.replace(/[^a-z]/g, "").length;

          // If 50% or more of the characters are uppercase, consider it shout spam,
          // and add a score of 5, plus 1 for every 12.5 uppercase characters.
          if (uppercase >= lowercase) {
            score += parseInt(5 + (20 * (uppercase / 250)));
            scoreReasons[ "Uppercase / Shouting" ] = parseInt(5 + (20 * (uppercase / 250)))
          }

          // Add score for repeating consecutive characters
          // 20 or more consecutive repeating characters = extremely spammy. Add 20 score.
          if (/(.)\1\1\1\1\1\1\1\1\1\1\1\1\1\1\1\1\1\1\1\1/.test(this.cleanContent.toLowerCase())) {
            score += 20;
            scoreReasons[ "Repeating Characters" ] = 20
            // 10 or more consecutive repeating characters = spammy. Add 10 score.
          } else if (/(.)\1\1\1\1\1\1\1\1\1\1/.test(this.cleanContent.toLowerCase())) {
            score += 10;
            scoreReasons[ "Repeating Characters" ] = 10
            // 5 or more consecutive repeating characters = a little bit spammy. Add 5 score.
          } else if (/(.)\1\1\1\1\1/.test(this.cleanContent.toLowerCase())) {
            score += 5;
            scoreReasons[ "Repeating Characters" ] = 5
          }

          // Add 40 score for here and everyone mentions as these are VERY spammy.
          if (this.content.includes("@here") || this.content.includes("@everyone")) {
            score += 40;
            scoreReasons[ "Here / Everyone Mention" ] = 40
          }

          // Add spam score for every new line; but the more content : new lines, the less spam score is added.
          // New lines when content length is 128 characters or less are considered very spammy.
          var newlines = this.cleanContent.split(/\r\n|\r|\n/).length - 1;
          var ratio = newlines / (this.cleanContent.length > 128 ? Math.ceil(this.cleanContent.length / 128) / 2 : 0.25);
          score += Math.round(ratio);
          if (newlines > 0 && ratio > 0) { scoreReasons[ "New Lines / Scrolling" ] = Math.round(ratio) }

          // Add score for repeating patterns
          // TODO: improve this algorithm
          var newstring = this.cleanContent;
          var regex = /(\W|^)(.+)\s\2/gmi;
          var matcher = regex.exec(this.cleanContent);
          while (matcher !== null) {
            newstring = newstring.replace(matcher[ 2 ], ``);
            matcher = regex.exec(this.cleanContent);
          }
          var patternScore = (this.cleanContent.length > 0 ? (newstring.length / this.cleanContent.length) : 1);

          // Pattern score of 100% means no repeating patterns. For every 4% less than 100%, add 1 score. Multiply depending on content length.
          score += parseInt(((1 - patternScore) * 25) * (1 + (0.1 * (this.cleanContent ? this.cleanContent.length / 100 : 0))))
          if (patternScore < 1) { scoreReasons[ "Repeating Patterns" ] = parseInt(((1 - patternScore) * 25) * (1 + (0.1 * (this.cleanContent ? this.cleanContent.length / 100 : 0)))) }

          // Add 3 points for every profane word used; excessive profanity spam
          sails.config.custom.discord.profanity.map((word) => {
            var numbers = getIndicesOf(word, this.cleanContent, false);
            if (numbers.length > 0) {
              score += (numbers.length * 3);
              if (typeof scoreReasons[ "Profanity" ] === `undefined`)
                scoreReasons[ "Profanity" ] = 0
              scoreReasons[ "Profanity" ] += (numbers.length * 3);
              //console.log(`profanity`);
            }
          });

          this.cachedSpamScore = score;

          sails.log.debug(scoreReasons);

          return score;
        } else {
          this.cachedSpamScore = score;

          sails.log.debug(scoreReasons);

          return score;
        }
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



  /*
      INITIALIZE SCHEDULES
  */

  // Initialize cron schedules
  var records = await sails.models.schedules.find();
  records.forEach(async (record) => {
    await sails.helpers.schedules.add(record);
  });
  await sails.models.schedules.findOrCreate({ uid: 'SYS-MINUTELY' }, { uid: 'SYS-MINUTELY', task: 'sysMinutely', cron: '* * * * *' });

};

function getIndicesOf (searchStr, str, caseSensitive) {
  var searchStrLen = searchStr.length;
  if (searchStrLen == 0) {
    return [];
  }
  var startIndex = 0, index, indices = [];
  if (!caseSensitive) {
    str = str.toLowerCase();
    searchStr = searchStr.toLowerCase();
  }
  while ((index = str.indexOf(searchStr, startIndex)) > -1) {
    indices.push(index);
    startIndex = index + searchStrLen;
  }
  return indices;
}