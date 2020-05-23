module.exports = {


  friendlyName: 'sails.helpers.schedules.remove',


  description: 'Remove a schedule.',


  inputs: {
    record: {
      type: 'json',
      require: true,
      description: 'The schedules database record'
    }
  },


  fn: async function (inputs) {
    // Remove the schedule
    if (typeof Schedules[ inputs.record.id ] !== undefined) {
      Schedules[ inputs.record.id ].cancel();
      delete Schedules[ inputs.record.id ];
    }
  }


};

