module.exports = {
  friendlyName: "spam.add",

  description: "Add spam score.",

  inputs: {
    member: {
      type: "ref",
      required: true,
      description: "The member to add spam score to"
    },
    amount: {
      type: "number",
      min: 0,
      required: true,
      description: "Amount of score to add"
    },
    message: {
      type: "ref",
      description:
        "If inputs.member spam score was added from a message, provide the message."
    }
  },

  fn: async function(inputs) {
    let guildSettings = await inputs.member.guild.settings();
    let memberSettings = await inputs.member.settings();

    // Ignore if score = 0 or if the member does not have the unverified role and has at least one other roles.
    if (
      inputs.amount === 0 ||
      (inputs.member.roles.cache.size > 1 &&
        !inputs.member.roles.cache.has(
          guildSettings.unverifiedRole
        ))
    )
      return null;

    // Ignore bot
    if (
      typeof inputs.message !== `undefined` &&
      inputs.message.author.id === DiscordClient.user.id
    )
      return null;

    var isMuted =
    guildSettings.muteRole &&
      inputs.member.roles.cache.get(guildSettings.muteRole);
    var currentScore = memberSettings.spamScore;
    var newScore = currentScore + inputs.amount;

    var modifier = {
      spamScore: memberSettings.spamScore + inputs.amount
    };

    // Check if the score has been breached
    if (currentScore < 100 && newScore >= 100) {
      // has it been more than 1 minute since the last warning? Give a warning.
      if (
        memberSettings.spamScoreStamp === null ||
        moment()
          .subtract(1, "minutes")
          .isAfter(moment(memberSettings.spamScoreStamp))
      ) {
        if (inputs.message) {
          var response = `:warning: <@${
            inputs.message.author.id
          }> , **DO YOU WANNA HAVE A BAD TIME?** ...'cause if you send another message in the next ${moment
            .duration(
              guildSettings.antispamCooldown > 0
                ? newScore / guildSettings.antispamCooldown + 1
                : 0,
              "minutes"
            )
            .format(
              "m [minutes]"
            )}, you are REALLY not going to like what happens next.`;
          inputs.message.send(response);
        }
      }
      modifier.spamScoreStamp = moment().toISOString(true);

      // Allow a 5-second grace period after warning so the member can read it. After 5 seconds, if they continue, take action.
    } else if (
      currentScore >= 100 &&
      moment()
        .subtract(5, "seconds")
        .isAfter(moment(memberSettings.spamScoreStamp))
    ) {
      // Reset the member's spam score
      modifier.spamScore = 0;

      // Add the mute role
      inputs.member.roles.add(
        guildSettings.muteRole,
        `Triggered the bot anti-spam`
      );

      // Kick out of voice channels
      if (inputs.member.voice.channel) {
        inputs.member.voice.kick(`User is muted`);
      }

      // Send a message
      if (inputs.message) {
        var response = `:mute: <@${inputs.message.author.id}> It's a beautiful day outside. Birds are singing, flowers are blooming... on days like these, kids like you... __SHOULD BE BURNING IN HELL__. (**You have been muted** until staff address / investigate your spamming)`;
        inputs.message.send(response);
      }
    }

    // Update the score
    await sails.models.members.updateOne(
      { userID: inputs.member.id, guildID: inputs.member.guild.id },
      modifier
    );
  }
};
