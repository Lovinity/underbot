var CronJob = require('cron').CronJob;

module.exports = {


  friendlyName: 'sails.helpers.schedules.add',


  description: 'Schedule a cron job to cache.',


  inputs: {
    record: {
      type: 'json',
      required: true,
      description: 'The schedules database record'
    }
  },


  fn: async function (inputs) {
    // Skip tasks that do not exist
    if (typeof sails.helpers.tasks === 'undefined' || typeof sails.helpers.tasks[ inputs.record.task ] === 'undefined') return;

    // Unschedule existing schedule if applicable
    await sails.helpers.schedules.remove(inputs.record);

    // Tasks that have a one-time run
    if (inputs.record.nextRun && !inputs.record.cron) {
      var temp = (async (record) => {
        Schedules[ record.id ] = new CronJob(moment(record.nextRun).toDate(), async () => {
          await sails.helpers.tasks[ record.task ].with(record.data || {});

          // Destroy the one-time schedule
          await sails.models.schedules.destroy({ id: record.id }).fetch();
        }, null, true);
      })(inputs.record);

      // Tasks that have a cron recurrence
    } else if (inputs.record.cron) {
      // If nextRun is specified, schedule a cron to schedule the cron at nextRun.
      if (inputs.record.nextRun && moment().isBefore(moment(inputs.record.nextRun))) {
        // Cron specific to nextRun, which when executed, schedules/starts the actual cron.
        var temp = (async (record) => {
          Schedules[ record.id ] = new CronJob(moment(record.nextRun).toDate(), async () => {
            // schedule/start the actual cron now; make it fire once immediately.
            Schedules[ record.id ].stop();
            Schedules[ record.id ] = new CronJob(record.cron, async () => {
              await sails.helpers.tasks[ record.task ].with(record.data || {});

              // Update lastRun
              await sails.models.schedules.updateOne({ id: record.id }, { lastRun: moment().format() });
            }, null, true, "UTC", null, true);
          }, null, true);
        })(inputs.record);
      } else { // no nextRun? Just schedule the cron
        var temp = (async (record) => {
          Schedules[ record.id ] = new CronJob(record.cron, async () => {
            await sails.helpers.tasks[ record.task ].with(record.data || {});

            // Update lastRun
            await sails.models.schedules.updateOne({ id: record.id }, { lastRun: moment().format() });
          }, null, true, "UTC");
        })(inputs.record);
      }
    }
  }


};
