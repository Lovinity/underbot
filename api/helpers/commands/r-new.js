module.exports = {


  friendlyName: 'helpers.commands.rNew',


  description: 'Create a reminder message',


  inputs: {
    message: {
      type: 'ref',
      required: true,
      description: 'Starts a wizard to add a new character into the database.'
    },
    time: {
      type: 'string',
      required: true,
      description: 'A string describing a duration of time from now, or a specific date/time, to be reminded.'
    },
    reminder: {
      type: 'string',
      required: true,
      description: 'The reminder message.'
    }
  },


  exits: {

    success: {
      description: 'All done.',
    },

  },


  fn: async function (inputs) {

    // Resolve time
    var datetime = await sails.helpers.resolvers.chronotime(inputs.time);

    // Set up a prompt function
    var prompt = async (prompt, time, remove = true, filter = (message) => message.author.id === inputs.message.author.id) => {
      // Prompt message
      var msg = await inputs.message.send(prompt);

      // Collect a response message
      try {
        var response = await inputs.message.channel.awaitMessages(filter, { max: 1, time: time, errors: [ 'time' ] });
      } catch (e) {
        throw new Error(`newcharacter command timed out.`);
      }

      // Delete sent message if remove is true
      if (remove) response.first().delete();

      response = response.first();

      // Cancel command if cancel was provided
      if (response.cleanContent.toLowerCase() === 'cancel') {
        throw new Error(`Command was canceled.`)
      }

      // Delete prompt message
      msg.delete();

      return response;
    }

    // Prompt confirmation
    confirmSchedule = async () => {
      var confirm = await prompt(`You are about to set a reminder for ${moment(datetime).format("LLLL Z")}. Is this correct? (timeout: 1 minute)`, 60000);
      if (confirm.cleanContent.toLowerCase() !== 'yes' && confirm.cleanContent.toLowerCase() !== 'y') {
        await rePromptSchedule();
      }
    }

    // Schedule re-prompting
    rePromptSchedule = async () => {
      datetime = await prompt(`Please specify a different date/time for your reminder. Specify your timezone if different from Eastern Time (America/New_York). (timeout: 2 minutes)`, 120000);
      datetime = datetime.cleanContent;
      await confirmSchedule();
    }

    await confirmSchedule();

    // Create the schedule
    uid = await sails.helpers.uid();
    await sails.models.schedules.create({ uid: uid, task: 'reminder', data: { user: inputs.message.author.id, channel: inputs.message.channel.id, reminder: inputs.reminder }, nextRun: moment(datetime).toISOString(true) }).fetch()

    return inputs.message.send(`:white_check_mark: Your reminder has been set! Its uid is ${uid}`);
  }


};

