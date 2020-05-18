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

    name: {
      type: 'string',
      maxLength: 64,
      description: 'Name of the character (use all lowercase)',
      required: true
    },

    sprite: {
      type: 'string',
      description: 'image name of the character sprite',
      defaultsTo: 'default.png'
    },

    font: {
      type: 'string',
      required: true,
      description: 'Name of the font to use for the character dialogue'
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

