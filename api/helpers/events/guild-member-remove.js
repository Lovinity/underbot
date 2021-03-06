module.exports = {
  friendlyName: "events.inputs.memberRemove",

  description: "Discord guild member remove event",

  inputs: {
    member: {
      type: "ref",
      required: true,
      description: "The member that left the guild"
    }
  },

  fn: async function(inputs) {
    // Can't do anything if the guild member is a partial
    if (inputs.member.partial) {
      const owner = DiscordClient.application.owner;
      if (owner) {
        owner.send(`:question: Partial guild member ${inputs.member.id} left.`);
      }
      return;
    }

    // Add deletion tasks for the members' characters for one day from now
    var characters = await sails.models.characters.find({
      userID: inputs.member.id
    });
    characters.forEach(async character => {
      uid = await sails.helpers.uid();
      await sails.models.schedules
        .create({
          uid: uid,
          task: "removeCharacter",
          data: { uid: character.uid },
          nextRun: moment()
            .add(1, "days")
            .format()
        })
        .fetch();
    });
  }
};
