module.exports = {


  friendlyName: 'sails.helpers.schedules.remove',


  description: 'Remove a schedule.',


  inputs: {
    record: {
      type: 'json',
      required: true,
      description: 'The schedules database record'
    }
  },


  fn: async function (inputs) {
    // Remove the schedule
    if (typeof Schedules[ inputs.record.id ] !== 'undefined') {
      Schedules[ inputs.record.id ].stop();
      delete Schedules[ inputs.record.id ];
    }
  }


};
