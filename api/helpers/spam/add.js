module.exports = {
  friendlyName: "spam.add",

  description: "Add spam score.",

  inputs: {
    member: {
      type: "ref",
      required: true,
      description: "The member to add spam score to",
    },
    amount: {
      type: "number",
      min: 0,
      required: true,
      description: "Amount of score to add",
    },
    message: {
      type: "ref",
      description:
        "If inputs.member spam score was added from a message, provide the message.",
    },
  },

  fn: async function (inputs) {
    // Ignore if score = 0 or if the member does not have the unverified role and has at least one other roles.

    if (
      inputs.amount === 0 ||
      (inputs.member.roles.cache.size > 1 &&
        !inputs.member.roles.cache.has(
          inputs.member.guild.settings.unverifiedRole
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
      inputs.member.guild.settings.muteRole &&
      inputs.member.roles.cache.get(inputs.member.guild.settings.muteRole);
    var currentScore = inputs.member.settings.spamScore;
    var newScore = currentScore + inputs.amount;

    var modifier = {
      spamScore: inputs.member.settings.spamScore + inputs.amount,
    };

    // Check if the score has been breached
    if (currentScore < 100 && newScore >= 100) {
      // has it been more than 1 minute since the last warning? Give a warning.
      if (
        inputs.member.settings.spamScoreStamp === null ||
        moment()
          .subtract(1, "minutes")
          .isAfter(moment(inputs.member.settings.spamScoreStamp))
      ) {
        if (inputs.message) {
          var response = `:warning: <@${
            inputs.message.author.id
          }> **Hey kid, stop the spamming.** Rest from sending messages for the next ${moment
            .duration(
              inputs.member.guild.settings.antispamCooldown > 0
                ? newScore / inputs.member.guild.settings.antispamCooldown + 1
                : 0,
              "minutes"
            )
            .format("m [Minutes]")}. Otherwise, you're gonna have a bad time. `;
          inputs.message.send(response);
        }
      }
      modifier.spamScoreStamp = moment().toISOString(true);

      // Allow a 10-second grace period after warning so the member can read it. After 10 seconds, if they continue, take action.
    } else if (
      currentScore >= 100 &&
      moment()
        .subtract(10, "seconds")
        .isAfter(moment(inputs.member.settings.spamScoreStamp))
    ) {
      // Reset the member's spam score
      modifier.spamScore = 0;

      // Add the mute role
      inputs.member.roles.add(
        inputs.member.guild.settings.muteRole,
        `Triggered the bot anti-spam`
      );

      // Kick out of voice channels
      if (inputs.member.voice.channel) {
        inputs.member.voice.kick(`User is muted`);
      }

      // Send a message
      if (inputs.message) {
        var response = `:mute: <@${inputs.message.author.id}> It's a beautiful day outside. Birds are singing, flowers are blooming... on days like these, kids like you... **SHOULD BE BURNING IN HELL**. (You have been muted until staff address / investigate your spamming)`;
        inputs.message.send(response);
      }
    }

    // Update the score
    Caches.get("members").set(
      [inputs.member.id, inputs.member.guild.id],
      modifier
    );
  },
};
