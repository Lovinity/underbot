module.exports = {
  friendlyName: "Sys minutely",

  description: "Task run minutely by the system.",

  inputs: {},

  fn: async function(inputs) {
    var members = await sails.models.members.find();
    var guilds = await sails.models.guilds.find();

    // Decay spam scores every minute
    members
      .filter(member => member.spamScore > 0) // Do not do anything for members with no spam score
      .forEach(async member => {
        var guild = guilds.find(guild => member.guildID === guild.guildID);
        var newScore = member.spamScore - (guild.antispamCooldown || 0);
        if (newScore < 0) newScore = 0;

        await sails.models.members.updateOne(
          { userID: member.userID, guildID: member.guilsID },
          { spamScore: newScore }
        );
      });

    // Every hour, scan for any characters whose owner is not in the guild and a task was not created.
    // Also, scan for active deletion schedules where the owner is back in the guild
    if (moment().minute() === 0) {
      var characters = await sails.models.characters.find();
      var schedules = await sails.models.schedules.find({
        task: "removeCharacter"
      });

      // Add deletion tasks for owners not in the guild
      characters.forEach(async character => {
        var guild = DiscordClient.guilds.resolve(character.guildID);
        if (guild) {
          if (character.userID === null) return; // Null user ID means unclaimed character. Do not delete.
          var member = guild.members.resolve(character.userID);
          if (
            !member &&
            !schedules.find(schedule => schedule.data.uid === character.uid)
          ) {
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
          }
        }
      });

      // Remove deletion tasks for owners in the guild
      schedules.map(async record => {
        let character2 = characters.find(char => char.uid === record.data.uid);
        if (character2) {
          var guild = DiscordClient.guilds.resolve(character2.guildID);
          if (guild) {
            var member = guild.members.resolve(character2.userID);
            if (member || character2.userID === null) {
              await sails.models.schedules.destroyOne({ id: record.id });
            }
          }
        }
      });
    }
  }
};
