/**
 * Members.js
 *
 * @description :: A list of guild members
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {

    userID: {
      type: 'string',
      required: true
    },

    guildID: {
      type: 'string',
      required: true
    },

    introduction: {
      type: 'string',
      defaultsTo: '',
      description: 'The introduction / profile info for this member'
    }

  },

  // Websockets and cache standards
  afterCreate: function (newlyCreatedRecord, proceed) {
    var data = { insert: newlyCreatedRecord }
    sails.sockets.broadcast(`members-${newlyCreatedRecord.guildID}`, 'members', data)
    Caches.set('members', newlyCreatedRecord);

    return proceed()
  },

  afterUpdate: function (updatedRecord, proceed) {
    var data = { update: updatedRecord }
    sails.sockets.broadcast(`members-${updatedRecord.guildID}`, 'members', data)
    Caches.set('members', updatedRecord);

    return proceed()
  },

  afterDestroy: function (destroyedRecord, proceed) {
    var data = { remove: destroyedRecord.id }
    sails.sockets.broadcast(`members-${destroyedRecord.guildID}`, 'members', data)
    Caches.del('members', destroyedRecord);

    return proceed()
  }

};
