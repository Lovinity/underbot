/**
 * Characters.js
 *
 * @description :: A collection of role play characters.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

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
      required: true,
      description: 'image name of the character sprite'
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

