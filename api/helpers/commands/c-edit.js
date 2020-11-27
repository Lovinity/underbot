const fs = require("fs");
const path = require("path");
const download = require("image-downloader");
const sanitize = require("sanitize-filename");

module.exports = {
  friendlyName: "commands.cEdit",

  description:
    "Edit a stat or information about a character (items has its own command). (Staff-only command).",

  inputs: {
    message: {
      type: "ref",
      required: true,
      description: "Starts a wizard to add a new character into the database.",
    },
    character: {
      type: "string",
      required: true,
      description:
        "The name of the character in the database to edit something.",
    },
  },

  exits: {},

  fn: async function (inputs) {
    var toUpdate = {};

    // Delete original command message
    inputs.message.delete();

    // Check permissions
    if (
      !inputs.message.member.permissions.has("VIEW_AUDIT_LOG") &&
      inputs.message.author.id !== sails.config.custom.discord.clientOwner
    ) {
      throw new Error(`You are not allowed to use this command.`);
    }

    // Get the character
    let guildCharacters = await inputs.message.guild.characters();
    var character = guildCharacters.find(
      (char) => char.name.toLowerCase() === inputs.character.toLowerCase()
    );

    // Check if the character exists
    if (!character) {
      throw new Error(`That character was not found in the database.`);
    }

    // Set up a prompt function
    var prompt = async (
      prompt,
      time,
      remove = true,
      filter = (message) => message.author.id === inputs.message.author.id
    ) => {
      // Prompt message
      var msg = await inputs.message.send(prompt);

      // Collect a response message
      try {
        var response = await inputs.message.channel.awaitMessages(filter, {
          max: 1,
          time: time,
          errors: ["time"],
        });
      } catch (e) {
        throw new Error(`Command timed out.`);
      }

      // Delete sent message if remove is true
      if (remove) response.first().delete();

      response = response.first();

      // Cancel command if cancel was provided
      if (response.cleanContent.toLowerCase() === "cancel") {
        throw new Error(`Command was canceled.`);
      }

      // Delete prompt message
      msg.delete();

      return response;
    };

    // Prompt for which property to edit
    var property = await prompt(
      `What do you want to edit for ${character.name}?: oc, claimable, owner, name, photo, sprite, nicknames, pronouns, age, height, appearance, personality, soulType, HP, maxHP, DT, EXP, ATK, DEF, gold, weapons, armor, likes, dislikes, extraInfo (items has their own commands). (timeout: 2 minutes)`,
      120000
    );
    property = property.cleanContent.toLowerCase();

    // Prompt based on what property we are editing
    switch (property) {
      case "name":
        var name = await prompt(
          `What is the new name of the character? You will use this name in character commands. (timeout: 2 minutes)`,
          120000
        );
        toUpdate.name = name.cleanContent;

        // Check if the name already exists
        if (
          guildCharacters.find(
            (char) => char.name.toLowerCase() === toUpdate.name.toLowerCase()
          )
        ) {
          throw new Error(`A character with the provided name already exists.`);
        }
        break;
      case "nicknames":
        var nicknames = await prompt(
          `What are the new nicknames this character is called? Current value: **${character.nicknames}** (timeout: 2 minutes)`,
          120000
        );
        toUpdate.nicknames = nicknames.cleanContent;
        break;
      case "oc":
        // Prompt for OC status
        var OC = await prompt(
          `Is this character an OC character (NOT an original Undertale character)? (timeout: 2 minutes)`,
          120000
        );
        toUpdate.OC =
          OC.cleanContent.toLowerCase() === "yes" ||
          OC.cleanContent.toLowerCase() === "y";
        break;
      case "claimable":
        // Prompt for claimable status
        var claimable = await prompt(
          `Can this character be re-claimed by someone else should the original claimer leave the guild for more than 24 hours? (if no, the character would be deleted instead) (timeout: 2 minutes)`,
          120000
        );
        toUpdate.claimable =
          claimable.cleanContent.toLowerCase() === "yes" ||
          claimable.cleanContent.toLowerCase() === "y";
        break;
      case "owner":
        var owner = await prompt(
          `Please provide the username, snowflake ID, or mention of the member who now owns this character. Or, type "none" to mark this character as unclaimed. (timeout: 2 minutes)`,
          120000
        );
        if (owner.cleanContent.toLowerCase() === "none") {
          toUpdate.userID = null;
        } else {
          toUpdate.userID = await sails.helpers.resolvers.username(
            inputs.message,
            owner.content
          );
          toUpdate.userID = toUpdate.userID.id;
        }
        break;
      case "photo":
        var photo = await prompt(
          `Please send a message with the new photo of the character attached or a URL to the photo. Or, send "none" to not specify a photo. (timeout: 3 minutes)`,
          180000,
          false,
          (message) =>
            message.author.id === inputs.message.author.id &&
            (message.attachments.size > 0 ||
              /(https?:\/\/[^\s]+)/g.test(
                message.content ||
                  message.content.cleanContent.toLowerCase() === "none"
              ))
        );
        if (photo.attachments.size > 0) {
          var photourl = photo.attachments.first().url;
        } else {
          var photourl = photo.cleanContent;
        }

        // Download the image locally
        if (photourl.toLowerCase() === "none") {
          toUpdate.photo = "default.png";
        } else {
          try {
            await download.image({
              url: photourl,
              dest: `./uploads/Characters/photos/${character.uid}${path.extname(
                photourl
              )}`,
              extractFilename: false,
            });
            await photo.delete();
            toUpdate.photo = `${character.uid}${path.extname(photourl)}`;
          } catch (e) {
            await sails.helpers.events.error(e);
            throw new Error(`Unable to download the provided image`);
          }
        }
        break;
      case "sprite":
        var sprite = await prompt(
          `Provide a new sprite image as an attachment or a URL to be used with the dialog command. The sprite should look 8-bit / pixelized, ideally back-and-white, look good against a black background, and have a transparent background (unless it's black), or it might not look good on the dialog. (timeout: 3 minutes)`,
          180000,
          false,
          (message) =>
            message.author.id === inputs.message.author.id &&
            (message.attachments.size > 0 ||
              /(https?:\/\/[^\s]+)/g.test(
                message.content ||
                  message.content.cleanContent.toLowerCase() === "none"
              ))
        );
        if (sprite.attachments.size > 0) {
          var spriteurl = sprite.attachments.first().url;
        } else {
          var spriteurl = sprite.cleanContent;
        }

        // Download the image locally
        if (spriteurl.toLowerCase() === "none") {
          toUpdate.sprite = "default.png";
        } else {
          try {
            await download.image({
              url: spriteurl,
              dest: `./uploads/Characters/sprites/${
                character.uid
              }${path.extname(spriteurl)}`,
              extractFilename: false,
            });
            await sprite.delete();
            toUpdate.sprite = `${character.uid}${path.extname(spriteurl)}`;
          } catch (e) {
            await sails.helpers.events.error(e);
            throw new Error(`Unable to download the provided image`);
          }
        }
        break;
      case "pronouns":
        var pronouns = await prompt(
          `What pronouns does this character use? Current value is **${character.pronouns}** (timeout: 2 minutes)`,
          120000
        );
        toUpdate.pronouns = pronouns.cleanContent;
        break;
      case "age":
        var age = await prompt(
          `How old is this character? Current value is **${character.age}** (timeout: 2 minutes)`,
          120000
        );
        toUpdate.age = age.cleanContent;
        break;
      case "height":
        var height = await prompt(
          `How tall is this character? Current value is **${character.height}** (timeout: 2 minutes)`,
          120000
        );
        toUpdate.height = height.cleanContent;
        break;
      case "appearance":
        var msg = await inputs.message.send(
          "```" + character.appearance + "```"
        );
        var appearance = await prompt(
          `Provide text descriptions of the character's new appearance. Or, type "none" to leave this blank. (timeout: 10 minutes)`,
          600000
        );
        appearance = appearance.cleanContent;
        if (appearance.toLowerCase() === "none") appearance = "";
        toUpdate.appearance = appearance;
        msg.delete();
        break;
      case "personality":
        var msg = await inputs.message.send(
          "```" + character.personality + "```"
        );
        var personality = await prompt(
          `Describe this character's new personality. Or, type "none" to leave this blank. (timeout: 10 minutes)`,
          600000
        );
        personality = personality.cleanContent;
        if (personality.toLowerCase() === "none") personality = "";
        toUpdate.personality = personality;
        msg.delete();
        break;
      case "likes":
        var msg = await inputs.message.send("```" + character.likes + "```");
        var likes = await prompt(
          `Make a new list of things this character likes, or type "none". (timeout: 5 minutes)`,
          300000
        );
        likes = likes.cleanContent;
        if (likes.toLowerCase() === "none") likes = "";
        toUpdate.likes = likes;
        msg.delete();
        break;
      case "dislikes":
        var msg = await inputs.message.send("```" + character.dislikes + "```");
        var dislikes = await prompt(
          `Make a new list of things this character dislikes, or type "none". (timeout: 5 minutes)`,
          300000
        );
        dislikes = dislikes.cleanContent;
        if (dislikes.toLowerCase() === "none") dislikes = "";
        toUpdate.dislikes = dislikes;
        msg.delete();
        break;
      case "soultype":
        var soulType = await prompt(
          `What soul type does this character have? Or, type "none" to leave this blank. Current value: **${character.soulType}** (timeout: 2 minutes)`,
          120000
        );
        soulType = soulType.cleanContent;
        if (soulType.toLowerCase() === "none") soulType = "";
        toUpdate.soulType = soulType;
        break;
      case "hp":
        var HP = await prompt(
          `Provide the character's current HP. (Must be a number, eg 20) (timeout: 2 minutes)`,
          120000
        );
        toUpdate.HP = parseInt(HP.cleanContent);
        break;
      case "maxhp":
        var maxHP = await prompt(
          `If this character has a static max HP that does not change, provide it here. Or, type 0 if this character's static HP should depend on their LVL (standard human Undertale EXP system). (Must be a number, eg 20) (timeout: 2 minutes)`,
          120000
        );
        toUpdate.maxHP = parseInt(maxHP.cleanContent);
        break;
      case "dt":
        var DT = await prompt(
          `Specify the character's DT (determination). (Must be a number, eg 20, and must be between 0 and 100.) (timeout: 2 minutes)`,
          120000
        );
        toUpdate.DT = parseInt(DT.cleanContent);
        break;
      case "exp":
        var EXP = await prompt(
          `Specify this character's new current EXP. (Must be a number, eg 20) (timeout: 2 minutes)`,
          120000
        );
        toUpdate.EXP = parseInt(EXP.cleanContent);
        break;
      case "atk":
        var ATK = await prompt(
          `What is this character's new ATK? You should also provide in parenthesis how much of an effect, in HP, the character's ATK has. For example: "10 (2)" (timeout: 2 minutes)`,
          120000
        );
        toUpdate.ATK = ATK.cleanContent;
        break;
      case "def":
        var DEF = await prompt(
          `What is this character's new DEF? You should also provide in parenthesis how much of an effect, in HP, the character's DEF has. For example: "10 (2)" (timeout: 2 minutes)`,
          120000
        );
        toUpdate.DEF = DEF.cleanContent;
        break;
      case "gold":
        var gold = await prompt(
          `How much G (gold) does this character have? (Must be a number, eg 20) (timeout: 2 minutes)`,
          120000
        );
        toUpdate.gold = gold.cleanContent;
        break;
      case "weapons":
        var msg = await inputs.message.send("```" + character.weapons + "```");
        var weapons = await prompt(
          `Describe the weapon(s) this character uses (or "none" for no weapons). You should put each weapon on a new line with a * or a -. You should also explain how each weapon works, and what effects they have in game play. (timeout: 10 minutes)`,
          600000
        );
        weapons = weapons.cleanContent;
        if (weapons.toLowerCase() === "none") weapons = "";
        toUpdate.weapons = weapons;
        msg.delete();
        break;
      case "armor":
        var msg = await inputs.message.send("```" + character.armor + "```");
        var armor = await prompt(
          `Describe the armor this character uses (or "none" for no armor). You should put each armor on a new line with a * or a -. You should also explain how each armor works, and what effects they have in game play. (timeout: 10 minutes)`,
          600000
        );
        armor = armor.cleanContent;
        if (armor.toLowerCase() === "none") armor = "";
        toUpdate.armor = armor;
        msg.delete();
        break;
      case "extrainfo":
        var msg = await inputs.message.send(
          "```" + character.extraInfo + "```"
        );
        var extraInfo = await prompt(
          `Provide any additional information about the character not covered by other fields, or type "none". (timeout: 10 minutes)`,
          600000
        );
        extraInfo = extraInfo.cleanContent;
        if (extraInfo.toLowerCase() === "none") extraInfo = "";
        toUpdate.extraInfo = extraInfo;
        msg.delete();
        break;
      default:
        throw new Error("Unrecognized property");
    }

    // Update database
    await sails.models.characters.updateOne({uid: character.uid}, toUpdate);

    return inputs.message.send(":white_check_mark: It has been edited!");
  },
};
