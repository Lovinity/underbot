module.exports = {
  friendlyName: "helpers.commands.rCancel",

  description: "Cancel a set reminder",

  inputs: {
    message: {
      type: "ref",
      required: true,
      description: "Starts a wizard to add a new character into the database.",
    },
    uid: {
      type: "string",
      required: true,
      description: "The uid of the reminder to cancel",
    },
  },

  exits: {
    success: {
      description: "All done.",
    },
  },

  fn: async function (inputs) {
    // Get the reminder task; error if not found
    var schedule = await sails.models.schedules.findOne({
      uid: inputs.uid,
      task: "reminder",
    });
    if (!schedule)
      throw new Error(`A reminder with the provided uid was not found.`);

    // Error if someone other than the one who created the reminder is trying to cancel it.
    if (schedule.data.user !== inputs.message.author.id)
      throw new Error(`You cannot cancel a reminder set by someone else.`);

    // Cancel the reminder.
    await sails.models.schedules.destroyOne({ id: schedule.id });

    return inputs.message.send(
      `:white_check_mark: The reminder has been canceled!`
    );
  },
};
