module.exports = {
  friendlyName: "commands.rpSave",

  description:
    "Use this command when a SAVE point has been triggered. A copy of the current character database/HP will be made and attached in a TXT file, and a save checkpoint ID will be posted in all text channels.",

  inputs: {
    message: {
      type: "ref",
      required: true,
      description: "The message that triggered the command",
    },
  },

  exits: {},

  fn: async function (inputs) {
    // Generate a SAVE uid
    var uid = await sails.helpers.uid();

    // Post the SAVE checkpoint in every active channel
    var maps = inputs.message.guild.channels.cache.map(async (channel) => {
      try {
        await channel.send(
          `:diamond_shape_with_a_dot_inside: **__A SAVE point has been triggered.__** :diamond_shape_with_a_dot_inside:  The role play world has been saved at this point in time. ID: ${uid}`
        );
      } catch (e) {
        // Just log errors to the console
        console.error(e);
      }
    });
    await Promise.all(maps);

    // Make a copy of the characters database
    var data =
      `+++ ROLE PLAY SAVE POINT, ID ${uid}, created ${moment().format(
        "LLLL"
      )}` + "\n";
    data += JSON.stringify(inputs.message.guild.characters);
    var buffer = Buffer.from(data, "utf-8");

    // Send the characters data
    return inputs.message.send(
      `Copy of the characters database has been attached for SAVE point ${uid}`,
      { files: [{ attachment: buffer, name: `SAVE_${uid}.txt` }] }
    );
  },
};
