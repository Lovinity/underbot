module.exports = {


  friendlyName: 'event.inputs.guildMemberAdd',


  description: 'Discord guild member add event',


  inputs: {
    member: {
      type: 'ref',
      required: true,
      description: 'Guild member added.'
    }
  },


  fn: async function (inputs) {
    // Upgrade partial members to full members
    if (inputs.member.partial) {
      await inputs.member.fetch();
    }

    // Check if there are any pending character deletion tasks, and if so, delete them.
    var schedules = await sails.models.schedules.find({ task: 'removeCharacter' });
    schedules.map(async (record) => {
      var character = Caches.get('characters').collection.find((char) => char.uid === record.data.uid);
      if (character && character.userID === inputs.member.id) {
        await sails.models.schedules.destroyOne({ id: record.id });
      }
    })
  }


};

