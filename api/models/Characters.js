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
      required: true,
      description: 'User who owns this character.'
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
      type: 'number',
      defaultsTo: 0,
      description: 'Character age, in years'
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
      description: 'The channelID.messageID containing the character stats, which is updated by commands.'
    }
  },

  // Websockets and cache standards
  afterCreate: function (newlyCreatedRecord, proceed) {
    var data = { insert: newlyCreatedRecord }
    sails.sockets.broadcast('characters', 'characters', data)
    Caches.set('characters', newlyCreatedRecord);

    return proceed()
  },

  afterUpdate: function (updatedRecord, proceed) {
    var data = { update: updatedRecord }
    sails.sockets.broadcast('characters', 'characters', data)
    Caches.set('characters', updatedRecord);

    return proceed()
  },

  afterDestroy: function (destroyedRecord, proceed) {
    var data = { remove: destroyedRecord.id }
    sails.sockets.broadcast('characters', 'characters', data)
    Caches.del('characters', destroyedRecord);

    return proceed()
  }

};

