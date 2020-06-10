module.exports = {


  friendlyName: 'Reminder',


  description: 'Reminder task fir Discord reminders.',


  inputs: {
    user: {
      type: 'string',
      required: true,
      description: "The user ID who set the reminder."
    },
    channel: {
      type: 'string',
      required: true,
      description: 'The channel ID the reminder was set in (and will be triggered)'
    },
    reminder: {
      type: 'string',
      required: true,
      description: "The reminder message."
    }
  },


  exits: {

    success: {
      description: 'All done.',
    },

  },


  fn: async function (inputs) {
    // Get the channel. Exit if not found.
    var channel = await DiscordClient.channels.resolve(inputs.channel);
    if (!channel) return;

    // Post the reminder
    return channel.send(`:alarm_clock: **Reminder for <@${inputs.user}>**: ${inputs.reminder}`);
  }


};

