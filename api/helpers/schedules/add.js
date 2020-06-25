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
      Schedules[ inputs.record.id ] = new CronJob(moment(inputs.record.nextRun).toDate(), async () => {
        await sails.helpers.tasks[ inputs.record.task ].with(inputs.record.data || {});

        // Destroy the one-time schedule
        await sails.models.schedules.destroy({ id: inputs.record.id }).fetch();
      }, null, true, "UTC");

      // Tasks that have a cron recurrence
    } else if (inputs.record.cron) {
      // If nextRun is specified, schedule a cron to schedule the cron at nextRun.
      if (inputs.record.nextRun && moment().isBefore(moment(inputs.record.nextRun))) {
        // Cron specific to nextRun, which when executed, schedules/starts the actual cron.
        Schedules[ inputs.record.id ] = new CronJob(moment(inputs.record.nextRun).toDate(), async () => {
          // schedule/start the actual cron now; make it fire once immediately.
          Schedules[ inputs.record.id ].stop();
          Schedules[ inputs.record.id ] = new CronJob(inputs.record.cron, async () => {
            await sails.helpers.tasks[ inputs.record.task ].with(inputs.record.data || {});
    
            // Update lastRun
            await sails.models.schedules.update({ id: inputs.record.id }, { lastRun: moment().toISOString(true) }).fetch();
          }, null, true, "UTC", null, true);
        }, null, true, "UTC");
      } else { // no nextRun? Just schedule the cron
        Schedules[ inputs.record.id ] = new CronJob(inputs.record.cron, async () => {
          await sails.helpers.tasks[ inputs.record.task ].with(inputs.record.data || {});
  
          // Update lastRun
          await sails.models.schedules.update({ id: inputs.record.id }, { lastRun: moment().toISOString(true) }).fetch();
        }, null, true, "UTC");
      }
    }
  }


};
