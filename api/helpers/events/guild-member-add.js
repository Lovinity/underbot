module.exports = {
  friendlyName: "event.inputs.guildMemberAdd",

  description: "Discord guild member add event",

  inputs: {
    member: {
      type: "ref",
      required: true,
      description: "Guild member added.",
    },
  },

  fn: async function (inputs) {
    // Upgrade partial members to full members
    if (inputs.member.partial) {
      await inputs.member.fetch();
    }

    // If member is supposed to be muted, mute them
    if (inputs.member.settings.muted) {
      inputs.member.roles.add(
        inputs.member.guild.settings.muteRole,
        `Was previously muted and left the guild; re-muted as they re-joined`
      );
      if (inputs.member.voice.channel) {
        inputs.member.voice.kick(`User is muted`);
      }
    }

    // Check if there are any pending character deletion tasks, and if so, delete them.
    var schedules = await sails.models.schedules.find({
      task: "removeCharacter",
    });
    schedules.map(async (record) => {
      var character = Caches.get("characters").collection.find(
        (char) => char.uid === record.data.uid
      );
      if (character && character.userID === inputs.member.id) {
        await sails.models.schedules.destroyOne({ id: record.id });
      }
    });
  },
};
