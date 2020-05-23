module.exports = {


  friendlyName: 'Sys minutely',


  description: 'Task run minutely by the system.',


  inputs: {

  },


  fn: async function (inputs) {

    // Every hour, scan for any characters whose owner is not in the guild and a task was not created.
    // Also, scan for active deletion schedules where the owner is back in the guild
    if (moment().minute() === 0) {
      var schedules = await sails.models.schedules.find({ task: 'removeCharacter' });

      // Add deletion tasks for owners not in the guild
      Caches.get('characters').collection.each(async (character) => {
        var guild = DiscordClient.guilds.resolve(character.guildID);
        if (guild) {
          var member = guild.members.resolve(character.userID);
          if (!member && !schedules.find((schedule) => schedule.data.uid === character.uid)) {
            uid = await sails.helpers.uid();
            await sails.models.schedules.create({ uid: uid, task: 'removeCharacter', data: { uid: character.uid }, nextRun: moment().add(1, 'days').toISOString(true) }).fetch()
          }
        }
      });

      // Remove deletion tasks for owners in the guild
      schedules.map(async (record) => {
        var character = Caches.get('characters').collection.find((char) => char.uid === record.data.uid);
        if (character) {
          var guild = DiscordClient.guilds.resolve(character.guildID);
          if (guild) {
            var member = guild.members.resolve(character.userID);
            if (member) {
              await sails.models.schedules.destroyOne({ id: record.id });
            }
          }
        }
      })
    }
  }

};

