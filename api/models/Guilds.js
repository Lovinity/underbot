/**
 * Guilds.js
 *
 * @description :: A list of Discord guilds and their settings
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {

    // API note: guildID should be the only required attribute; try to define defaultsTo where applicable
    guildID: {
      type: 'string',
      required: true,
      unique: true
    },

    prefix: {
      type: 'string',
      allowNull: true,
      description: 'Change the bot prefix on a per-guild bases by specifying a new prefix.'
    },

  },

  // Websockets and cache standards
  afterCreate: function (newlyCreatedRecord, proceed) {
    var data = { insert: newlyCreatedRecord }
    sails.sockets.broadcast('guilds', 'guilds', data)
    Caches.set('guilds', newlyCreatedRecord);

    return proceed()
  },

  afterUpdate: function (updatedRecord, proceed) {
    var data = { update: updatedRecord }
    sails.sockets.broadcast('guilds', 'guilds', data)
    Caches.set('guilds', updatedRecord);

    return proceed()
  },

  afterDestroy: function (destroyedRecord, proceed) {
    var data = { remove: destroyedRecord.id }
    sails.sockets.broadcast('guilds', 'guilds', data)
    Caches.del('guilds', destroyedRecord);

    return proceed()
  }

};

