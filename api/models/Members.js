/**
 * Members.js
 *
 * @description :: A list of guild members
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
  attributes: {
    userID: {
      type: "string",
      required: true,
    },

    guildID: {
      type: "string",
      required: true,
    },

    introduction: {
      type: "string",
      defaultsTo: "",
      description: "The introduction / profile info for this member",
      maxLength: 2000,
      columnType: "varchar(2000)",
    },

    spamScore: {
      type: "number",
      defaultsTo: 0,
      description: "Spam score for anti-raid features.",
    },

    spamScoreStamp: {
      type: "ref",
      columnType: "datetime",
      defaultsTo: moment().toISOString(true),
      description:
        "Date/time when the member last received a nudge by the bot for spam.",
    },

    muted: {
      type: "boolean",
      defaultsTo: false,
      description: "Whether or not the member is muted.",
    },

    rpPosts: {
      type: 'number',
      defaultsTo: 0,
      description: "The total number of official RP posts this member has made."
    }
  },

  // Websockets and cache standards
  afterCreate: function (newlyCreatedRecord, proceed) {
    var data = { insert: newlyCreatedRecord };
    sails.sockets.broadcast(
      `members-${newlyCreatedRecord.guildID}`,
      "members",
      data
    );
    Caches.set("members", newlyCreatedRecord);

    return proceed();
  },

  afterUpdate: function (updatedRecord, proceed) {
    var data = { update: updatedRecord };
    sails.sockets.broadcast(
      `members-${updatedRecord.guildID}`,
      "members",
      data
    );
    Caches.set("members", updatedRecord);

    return proceed();
  },

  afterDestroy: function (destroyedRecord, proceed) {
    var data = { remove: destroyedRecord.id };
    sails.sockets.broadcast(
      `members-${destroyedRecord.guildID}`,
      "members",
      data
    );
    Caches.del("members", destroyedRecord);

    return proceed();
  },
};
