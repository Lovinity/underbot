/**
 * Characters.js
 *
 * @description :: A collection of characters for the dialog command.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

// API note: This model should be used with the CacheManager. Do not use sails.js create, find, update, or destroy. Use the cache instead.

module.exports = {

  attributes: {

    uid: {
      type: 'string',
      unique: true,
      required: true
    },

    guildID: {
      type: 'string',
      required: true
    },

    userID: {
      type: 'string',
      allowNull: true,
      description: 'User who owns this character. Null if the character is not claimed yet.'
    },

    OC: {
      type: 'boolean',
      defaultsTo: false,
      description: 'Is this character an OC? If true, this character will be deleted 24 hours after the owner leaves the guild. If false, the character will simply have its userID erased.'
    },

    name: {
      type: 'string',
      description: 'Name of the character (use all lowercase in the database). Thjis is used in character commands.',
      required: true
    },

    photo: {
      type: 'string',
      description: 'Name of the character photo file.',
      defaultsTo: 'default.png'
    },

    sprite: {
      type: 'string',
      description: 'image name of the character sprite. Image should look good against a black background and be pixelized (dialog command).',
      defaultsTo: 'default.png'
    },

    font: {
      type: 'string',
      defaultsTo: 'determination',
      description: 'Name of the font to use for the character dialog command.'
    },

    nicknames: {
      type: 'string',
      defaultsTo: '',
      description: 'Provide nicknames / alternate names this character is called.'
    },

    pronouns: {
      type: 'string',
      defaultsTo: '',
      description: 'Character pronouns'
    },

    age: {
      type: 'string',
      defaultsTo: 'Unknown',
      description: 'Character age'
    },

    height: {
      type: 'string',
      defaultsTo: '',
      description: 'The height of the character'
    },

    appearance: {
      type: 'string',
      defaultsTo: '',
      description: 'A description of the character appearance.'
    },

    personality: {
      type: 'string',
      defaultsTo: '',
      description: 'A description of the character personality and how they behave.'
    },

    soulType: {
      type: 'string',
      defaultsTo: 'None',
      description: 'The type of soul this character has'
    },

    HP: {
      type: 'number',
      defaultsTo: 20,
      description: 'Character current HP'
    },

    maxHP: {
      type: 'number',
      description: 'Maximum HP of the character (negates leveling), or 0 to use the level system max HP.'
    },

    EXP: {
      type: 'number',
      defaultsTo: 0,
      description: 'Character EXP.'
    },

    ATK: {
      type: 'string',
      defaultsTo: '0 [0]',
      description: 'The character attack strength.'
    },

    DEF: {
      type: 'string',
      defaultsTo: '0 [0]',
      description: 'The character defense.'
    },

    gold: {
      type: 'number',
      defaultsTo: 0,
      description: 'How much G (gold) the character currently has'
    },

    items: {
      type: 'json',
      defaultsTo: [],
      description: 'An array of items the character has. {name, description}'
    },

    weapons: {
      type: 'string',
      defaultsTo: '',
      description: 'A description of the weapon(s) the character uses and how it affects gameplay.'
    },

    armor: {
      type: 'string',
      defaultsTo: '',
      description: 'A description of the armor the character uses and how it affects gameplay.'
    },

    likes: {
      type: 'string',
      defaultsTo: '',
      description: 'A list of what the character enjoys'
    },

    dislikes: {
      type: 'string',
      defaultsTo: '',
      description: 'A list of what the character does not enjoy'
    },

    extraInfo: {
      type: 'string',
      defaultsTo: '',
      description: 'Any additional information about this character.'
    },

    tallyMessage: {
      type: 'string',
      allowNull: true,
      description: 'The message ID containing the character stats, which is updated by commands, and is posted in the guild characterStatsChannel.'
    }
  },

  // Websockets and cache standards
  afterCreate: function (newlyCreatedRecord, proceed) {
    var data = { insert: newlyCreatedRecord }
    sails.sockets.broadcast('characters', 'characters', data)
    Caches.set('characters', newlyCreatedRecord);

    // New stats message if characterStatsChannel exists
    var temp = (async (character) => {
      var guild = await DiscordClient.guilds.resolve(character.guildID);
      if (guild && guild.settings.characterStatsChannel) {
        var channel = await DiscordClient.channels.resolve(guild.settings.characterStatsChannel);
        if (channel) {
          var embed = await sails.helpers.characters.generateStatsEmbed(character);
          var message = await channel.send({ embed: embed });
          Caches.get('characters').set([ character.uid ], () => {
            return { tallyMessage: message.id }
          });
        }
      }
    })(newlyCreatedRecord)

    return proceed()
  },

  afterUpdate: function (updatedRecord, proceed) {
    var data = { update: updatedRecord }
    sails.sockets.broadcast('characters', 'characters', data)
    Caches.set('characters', updatedRecord);

    // Update stats message if it exists
    var temp = (async (character) => {
      var guild = await DiscordClient.guilds.resolve(character.guildID);
      if (guild && guild.settings.characterStatsChannel) {
        var channel = await DiscordClient.channels.resolve(guild.settings.characterStatsChannel);
        if (channel && character.tallyMessage) {
          var message = await channel.messages.fetch(character.tallyMessage);
          if (message) {
            var embed = await sails.helpers.characters.generateStatsEmbed(character);
            await message.edit({ embed: embed });
          }
        }
      }
    })(updatedRecord)

    return proceed()
  },

  afterDestroy: function (destroyedRecord, proceed) {
    var data = { remove: destroyedRecord.id }
    sails.sockets.broadcast('characters', 'characters', data)
    Caches.del('characters', destroyedRecord);

    // delete stats message if it exists
    var temp = (async (character) => {
      var guild = await DiscordClient.guilds.resolve(character.guildID);
      if (guild && guild.settings.characterStatsChannel) {
        var channel = await DiscordClient.channels.resolve(guild.settings.characterStatsChannel);
        if (channel && character.tallyMessage) {
          var message = await channel.messages.fetch(character.tallyMessage);
          if (message) {
            await message.delete();
          }
        }
      }
    })(destroyedRecord)

    return proceed()
  }

};

