/**
 * Characters.js
 *
 * @description :: A collection of characters for the dialog command.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

// API note: This model should be used with the CacheManager. Do not use sails.js create, find, update, or destroy. Use the cache instead.

module.exports = {
  attributes: {
    uid: {
      type: "string",
      unique: true,
      required: true,
    },

    guildID: {
      type: "string",
      required: true,
    },

    userID: {
      type: "string",
      allowNull: true,
      description:
        "User who owns this character. Null if the character is not claimed yet.",
    },

    OC: {
      type: "boolean",
      defaultsTo: false,
      description: "Is this character an OC? If false, it is an OG.",
    },

    claimable: {
      type: "boolean",
      defaultsTo: false,
      description:
        "Can this character be claimed? If true, should the claimer leave the guild, someone else can claim the character. If false, this character disintegrates / gets deleted.",
    },

    name: {
      type: "string",
      description:
        "Name of the character (use all lowercase in the database). Thjis is used in character commands.",
      required: true,
    },

    photo: {
      type: "string",
      description: "Name of the character photo file.",
      defaultsTo: "default.png",
    },

    sprite: {
      type: "string",
      description:
        "image name of the character sprite. Image should look good against a black background and be pixelized (dialog command).",
      defaultsTo: "default.png",
    },

    font: {
      type: "string",
      defaultsTo: "determination",
      description: "Name of the font to use for the character dialog command.",
    },

    nicknames: {
      type: "string",
      defaultsTo: "",
      description:
        "Provide nicknames / alternate names this character is called.",
    },

    pronouns: {
      type: "string",
      defaultsTo: "",
      description: "Character pronouns",
    },

    age: {
      type: "string",
      defaultsTo: "Unknown",
      description: "Character age",
    },

    height: {
      type: "string",
      defaultsTo: "",
      description: "The height of the character",
    },

    appearance: {
      type: "string",
      defaultsTo: "",
      description: "A description of the character appearance.",
      maxLength: 2000,
      columnType: "varchar(2000)",
    },

    personality: {
      type: "string",
      defaultsTo: "",
      description:
        "A description of the character personality and how they behave.",
      maxLength: 2000,
      columnType: "varchar(2000)",
    },

    soulType: {
      type: "string",
      defaultsTo: "None",
      description: "The type of soul this character has",
    },

    HP: {
      type: "number",
      defaultsTo: 20,
      description: "Character current HP",
    },

    maxHP: {
      type: "number",
      defaultsTo: 20,
      description:
        "Maximum HP of the character (negates leveling), or 0 to use the level system max HP.",
    },

    EXP: {
      type: "number",
      defaultsTo: 0,
      description: "Character EXP.",
    },

    ATK: {
      type: "string",
      defaultsTo: "0 [0]",
      description: "The character attack strength.",
    },

    DEF: {
      type: "string",
      defaultsTo: "0 [0]",
      description: "The character defense.",
    },

    DT: {
      type: "number",
      defaultsTo: 50,
      min: 0,
      max: 100,
      description: "The character determination.",
    },

    gold: {
      type: "number",
      defaultsTo: 0,
      description: "How much G (gold) the character currently has",
    },

    items: {
      type: "json",
      defaultsTo: [],
      description: "An array of items the character has. {name, description}",
    },

    weapons: {
      type: "string",
      defaultsTo: "",
      description:
        "A description of the weapon(s) the character uses and how it affects gameplay.",
      maxLength: 2000,
      columnType: "varchar(2000)",
    },

    armor: {
      type: "string",
      defaultsTo: "",
      description:
        "A description of the armor the character uses and how it affects gameplay.",
      maxLength: 2000,
      columnType: "varchar(2000)",
    },

    likes: {
      type: "string",
      defaultsTo: "",
      description: "A list of what the character enjoys",
      maxLength: 2000,
      columnType: "varchar(2000)",
    },

    dislikes: {
      type: "string",
      defaultsTo: "",
      description: "A list of what the character does not enjoy",
      maxLength: 2000,
      columnType: "varchar(2000)",
    },

    extraInfo: {
      type: "string",
      defaultsTo: "",
      description: "Any additional information about this character.",
      maxLength: 2000,
      columnType: "varchar(2000)",
    },

    tallyMessage: {
      type: "string",
      allowNull: true,
      description:
        "The message ID containing the character stats, which is updated by commands, and is posted in the guild characterStatsChannel.",
    },

    ogMessage: {
      type: "string",
      allowNull: true,
      description:
        "The message ID posted in the OG channel if this is an OG character.",
    },

    ocMessage: {
      type: "string",
      allowNull: true,
      description:
        "The message ID posted in the OC channel if this is an OC character.",
    },
  },

  // Websockets and cache standards
  afterCreate: function (newlyCreatedRecord, proceed) {
    var data = { insert: newlyCreatedRecord };
    sails.sockets.broadcast(
      `characters-${newlyCreatedRecord.guildID}`,
      "characters",
      data
    );
    Caches.set("characters", newlyCreatedRecord);

    var temp = (async (character) => {
      var guild = await DiscordClient.guilds.resolve(character.guildID);

      if (guild) {
        // New stats message if characterStatsChannel exists
        if (guild.settings.characterStatsChannel) {
          var channel = await DiscordClient.channels.resolve(
            guild.settings.characterStatsChannel
          );
          if (channel) {
            var embed = await sails.helpers.characters.generateStatsEmbed(
              character
            );
            var message = await channel.send({ embed: embed });
            Caches.get("characters").set([character.uid], {
              tallyMessage: message.id,
            });
          }
        }

        // New character list message
        if (character.OC) {
          var channel = await DiscordClient.channels.resolve(
            guild.settings.ocChannel
          );
          if (channel) {
            var message = await channel.send(
              `**${character.name}** - ${
                character.userID
                  ? `claimed by <@${character.userID}>`
                  : `${
                      character.claimable
                        ? `UNCLAIMED (you can claim them by making a submission)`
                        : `UNCLAIMED (this character cannot be claimed at this time)`
                    }`
              } (${sails.config.custom.baseURL}/character/${character.uid})`
            );
            Caches.get("characters").set([character.uid], {
              ocMessage: message.id,
            });
          }
        } else {
          var channel = await DiscordClient.channels.resolve(
            guild.settings.ogChannel
          );
          if (channel) {
            var message = await channel.send(
              `**${character.name}** - ${
                character.userID
                  ? `claimed by <@${character.userID}>`
                  : `${
                      character.claimable
                        ? `UNCLAIMED (you can claim them by making a submission)`
                        : `UNCLAIMED (this character cannot be claimed at this time)`
                    }`
              } (${sails.config.custom.baseURL}/character/${character.uid})`
            );
            Caches.get("characters").set([character.uid], {
              ogMessage: message.id,
            });
          }
        }
      }
    })(newlyCreatedRecord);

    return proceed();
  },

  afterUpdate: function (updatedRecord, proceed) {
    var data = { update: updatedRecord };
    sails.sockets.broadcast(
      `characters-${updatedRecord.guildID}`,
      "characters",
      data
    );
    Caches.set("characters", updatedRecord);

    var temp = (async (character) => {
      var guild = await DiscordClient.guilds.resolve(character.guildID);
      if (guild) {
        // Update stats message if it exists
        if (guild.settings.characterStatsChannel) {
          var channel = await DiscordClient.channels.resolve(
            guild.settings.characterStatsChannel
          );
          if (channel && character.tallyMessage) {
            try {
              var message = await channel.messages.fetch(
                character.tallyMessage
              );
              if (message) {
                var embed = await sails.helpers.characters.generateStatsEmbed(
                  character
                );
                await message.edit({ embed: embed });
              }
            } catch (e) {
              sails.log.error(e);
            }
          }
        }

        // Update list message if it exists
        if (character.ocMessage && !character.OC) {
          var channel = await DiscordClient.channels.resolve(
            guild.settings.ocChannel
          );
          if (channel) {
            try {
              var message = await channel.messages.fetch(character.ocMessage);
              if (message) {
                await message.delete();
              }
            } catch (e) {
              sails.log.error(e);
            }
          }
          Caches.get("characters").set([character.uid], { ocMessage: null });
          var channel = await DiscordClient.channels.resolve(
            guild.settings.ogChannel
          );
          if (channel) {
            var message = await channel.send(
              `**${character.name}** - ${
                character.userID
                  ? `claimed by <@${character.userID}>`
                  : `${
                      character.claimable
                        ? `UNCLAIMED (you can claim them by making a submission)`
                        : `UNCLAIMED (this character cannot be claimed at this time)`
                    }`
              } (${sails.config.custom.baseURL}/character/${character.uid})`
            );
            Caches.get("characters").set([character.uid], {
              ogMessage: message.id,
            });
          }
        } else if (character.ogMessage && character.OC) {
          var channel = await DiscordClient.channels.resolve(
            guild.settings.ogChannel
          );
          if (channel) {
            try {
              var message = await channel.messages.fetch(character.ogMessage);
              if (message) {
                await message.delete();
              }
            } catch (e) {
              sails.log.error(e);
            }
          }
          Caches.get("characters").set([character.uid], { ogMessage: null });
          var channel = await DiscordClient.channels.resolve(
            guild.settings.ocChannel
          );
          if (channel) {
            var message = await channel.send(
              `**${character.name}** - ${
                character.userID
                  ? `claimed by <@${character.userID}>`
                  : `${
                      character.claimable
                        ? `UNCLAIMED (you can claim them by making a submission)`
                        : `UNCLAIMED (this character cannot be claimed at this time)`
                    }`
              } (${sails.config.custom.baseURL}/character/${character.uid})`
            );
            Caches.get("characters").set([character.uid], {
              ocMessage: message.id,
            });
          }
        } else {
          if (character.ogMessage) {
            var channel = await DiscordClient.channels.resolve(
              guild.settings.ogChannel
            );
            if (channel) {
              try {
                var message = await channel.messages.fetch(character.ogMessage);
                if (message) {
                  await message.edit(
                    `**${character.name}** - ${
                      character.userID
                        ? `claimed by <@${character.userID}>`
                        : `${
                            character.claimable
                              ? `UNCLAIMED (you can claim them by making a submission)`
                              : `UNCLAIMED (this character cannot be claimed at this time)`
                          }`
                    } (${sails.config.custom.baseURL}/character/${
                      character.uid
                    })`
                  );
                }
              } catch (e) {
                sails.log.error(e);
              }
            }
          } else if (character.ocMessage) {
            var channel = await DiscordClient.channels.resolve(
              guild.settings.ocChannel
            );
            if (channel) {
              try {
                var message = await channel.messages.fetch(character.ocMessage);
                if (message) {
                  await message.edit(
                    `**${character.name}** - ${
                      character.userID
                        ? `claimed by <@${character.userID}>`
                        : `${
                            character.claimable
                              ? `UNCLAIMED (you can claim them by making a submission)`
                              : `UNCLAIMED (this character cannot be claimed at this time)`
                          }`
                    } (${sails.config.custom.baseURL}/character/${
                      character.uid
                    })`
                  );
                }
              } catch (e) {
                sails.log.error(e);
              }
            }
          }
        }
      }
    })(updatedRecord);

    return proceed();
  },

  afterDestroy: function (destroyedRecord, proceed) {
    var data = { remove: destroyedRecord.id };
    sails.sockets.broadcast(
      `characters-${destroyedRecord.guildID}`,
      "characters",
      data
    );
    Caches.del("characters", destroyedRecord);

    var temp = (async (character) => {
      var guild = await DiscordClient.guilds.resolve(character.guildID);
      if (guild) {
        // delete stats message if it exists
        if (guild.settings.characterStatsChannel) {
          var channel = await DiscordClient.channels.resolve(
            guild.settings.characterStatsChannel
          );
          if (channel && character.tallyMessage) {
            try {
              var message = await channel.messages.fetch(
                character.tallyMessage
              );
              if (message) {
                await message.delete();
              }
            } catch (e) {
              sails.log.error(e);
            }
          }
        }

        // Delete character messages if they exist
        if (character.ocMessage) {
          var channel = await DiscordClient.channels.resolve(
            guild.settings.ocChannel
          );
          if (channel) {
            try {
              var message = await channel.messages.fetch(character.ocMessage);
              if (message) {
                await message.delete();
              }
            } catch (e) {
              sails.log.error(e);
            }
          }
          Caches.get("characters").set([character.uid], { ocMessage: null });
        }
        if (character.ogMessage) {
          var channel = await DiscordClient.channels.resolve(
            guild.settings.ogChannel
          );
          if (channel) {
            try {
              var message = await channel.messages.fetch(character.ogMessage);
              if (message) {
                await message.delete();
              }
            } catch (e) {
              sails.log.error(e);
            }
          }
          Caches.get("characters").set([character.uid], { ogMessage: null });
        }
      }
    })(destroyedRecord);

    return proceed();
  },
};
