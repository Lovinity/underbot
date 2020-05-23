/**
 * Schedules.js
 *
 * @description :: A list of cron tasks.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {

    uid: {
      type: 'string',
      unique: true,
      required: true
    },

    task: {
      type: 'string',
      required: true
    },

    data: {
      type: 'json'
    },

    lastRun: {
      type: 'ref',
      columnType: 'datetime'
    },

    nextRun: {
      type: 'ref',
      columnType: 'datetime'
    },

    catchUp: {
      type: 'boolean',
      defaultsTo: true
    },

    cron: {
      type: 'string',
      allowNull: true
    }


  },

  // Websockets and cache standards
  afterCreate: function (newlyCreatedRecord, proceed) {
    var data = { insert: newlyCreatedRecord }
    sails.sockets.broadcast('schedules', 'schedules', data)

    // Schedule the new schedule in cron
    sails.helpers.schedules.add(newlyCreatedRecord).exec(() => { });

    return proceed()
  },

  afterUpdate: function (updatedRecord, proceed) {
    var data = { update: updatedRecord }
    sails.sockets.broadcast('schedules', 'schedules', data)

    // Re-schedule the schedule in cron
    sails.helpers.schedules.add(updatedRecord).exec(() => { });

    return proceed()
  },

  afterDestroy: function (destroyedRecord, proceed) {
    var data = { remove: destroyedRecord.id }
    sails.sockets.broadcast('schedules', 'schedules', data)

    // Remove the schedule from cron
    sails.helpers.schedules.remove(destroyedRecord).exec(() => { });

    return proceed()
  }

};

