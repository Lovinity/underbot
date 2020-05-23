var schedule = require('node-schedule');

module.exports = {


  friendlyName: 'sails.helpers.schedules.add',


  description: 'Schedule a cron job to cache.',


  inputs: {
    record: {
      type: 'json',
      require: true,
      description: 'The schedules database record'
    }
  },


  fn: async function (inputs) {
    // Skip tasks that do not exist
    if (typeof sails.helpers.tasks === 'undefined' || typeof sails.helpers.tasks[ inputs.record.task ] === 'undefined') return;

    // Unschedule existing schedule if applicable
    if (typeof Schedules[ inputs.record.id ] !== 'undefined') {
      Schedules[ inputs.record.id ].cancel();
    }

    // Tasks that have a one-time run
    if (inputs.record.nextRun && !inputs.record.cron) {
      Schedules[ inputs.record.id ] = schedule.scheduleJob(moment(inputs.record.nextRun).toDate(), async () => {
        await sails.helpers.tasks[ inputs.record.task ].with(inputs.record.data || {});

        // Destroy the one-time schedule
        await sails.models.schedules.destroy({ id: inputs.record.id }).fetch();
      });

      // Tasks that have a cron recurrence
    } else if (inputs.record.cron) {
      var options = { rule: inputs.record.cron };
      if (inputs.record.catchUp) {
        options.start = moment(inputs.record.nextRun || inputs.record.lastRun).toDate();
      }
      Schedules[ inputs.record.id ] = schedule.scheduleJob(options, async () => {
        await sails.helpers.tasks[ inputs.record.task ].with(inputs.record.data || {});

        // Update lastRun
        await sails.models.schedules.update({ id: inputs.record.id }, { lastRun: moment().toISOString(true) }).fetch();
      });
    }
  }


};

