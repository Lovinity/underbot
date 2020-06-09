const fs = require('fs');
const path = require('path');
const download = require('image-downloader');
const sanitize = require("sanitize-filename");

module.exports = {


  friendlyName: 'commands.cNew',


  description: 'Add a new character into the database. (Staff-only command)',


  inputs: {
    message: {
      type: 'ref',
      required: true,
      description: 'Starts a wizard to add a new character into the database.'
    },
  },


  exits: {

  },


  fn: async function (inputs) {
    // Delete original command message
    inputs.message.delete();

    // Check permissions
    if (!inputs.message.member.permissions.has('VIEW_AUDIT_LOG') && inputs.message.author.id !== sails.config.custom.discord.clientOwner) {
      throw new Error(`You are not allowed to use this command.`);
    }

    // generate a UID
    var uid = await sails.helpers.uid();

    // Set up a prompt function
    var prompt = async (prompt, time, remove = true, filter = (message) => message.author.id === inputs.message.author.id) => {
      // Prompt message
      var msg = await inputs.message.send(prompt);

      // Collect a response message
      try {
        var response = await inputs.message.channel.awaitMessages(filter, { max: 1, time: time, errors: [ 'time' ] });
      } catch (e) {
        throw new Error(`newcharacter command timed out.`);
      }

      // Delete sent message if remove is true
      if (remove) response.first().delete();

      response = response.first();

      // Cancel command if cancel was provided
      if (response.cleanContent.toLowerCase() === 'cancel') {
        throw new Error(`Command was canceled.`)
      }

      // Delete prompt message
      msg.delete();

      return response;
    }

    // Prompt for the name
    var name = await prompt(`Let's get started with adding a new character into the database! First, what is the name of the character? You will use this name in character commands. (timeout: 2 minutes)`, 120000);
    name = name.cleanContent;

    // Check if the name already exists
    var prevCharacter = inputs.message.guild.characters.find((char) => char.name.toLowerCase() === name.toLowerCase());
    if (prevCharacter) {
      uid = prevCharacter.uid;
      await prompt(`:warning: A character with that name already exists. If you proceed, you will be overwriting the character sheet. Type/send "cancel" to exit, or send anything else to proceed. (timeout: 2 minutes)`, 120000);
    }

    // Prompt for nicknames
    var nicknames = await prompt(`Killer name! What other (nick) names does this character get called? (timeout: 2 minutes)`, 120000);
    nicknames = nicknames.cleanContent;

    // Prompt for OC status
    var OC = await prompt(`Aww, those are cute! Is this character an OC character (NOT an original Undertale character)? (timeout: 2 minutes)`, 120000);
    OC = OC.cleanContent.toLowerCase() === 'yes' || OC.cleanContent.toLowerCase() === 'y';

    // Prompt for claimable status
    var claimable = await prompt(`Cool! Can this character be re-claimed by someone else should the original claimer leave the guild for more than 24 hours? (if no, the character would be deleted instead) (timeout: 2 minutes)`, 120000);
    claimable = claimable.cleanContent.toLowerCase() === 'yes' || claimable.cleanContent.toLowerCase() === 'y';

    // Prompt for the member who owns this character
    var owner = await prompt(`Alrighty! Now, Please provide the username, snowflake ID, or mention of the member who owns / has claim over this character. Or, type "none" if this character is not claimed yet. (timeout: 2 minutes)`, 120000);
    if (owner.cleanContent.toLowerCase() === 'none') {
      owner = null;
    } else {
      owner = await sails.helpers.resolvers.username(inputs.message, owner.content);
      owner = owner.id;
    }

    // Prompt for a photo
    var photo = await prompt(`Awesome! Next, if there is a good photo of this character, please send a message with that photo attached or a URL to the photo. Or, send "none" to not specify a photo. (timeout: 3 minutes)`, 180000, false, (message) => message.author.id === inputs.message.author.id && (message.attachments.size > 0 || /(https?:\/\/[^\s]+)/g.test(message.content || message.content.cleanContent.toLowerCase() === 'none')));
    if (photo.attachments.size > 0) {
      var photourl = photo.attachments.first().url;
    } else {
      var photourl = photo.cleanContent;
    }

    // Download the image locally
    if (photourl.toLowerCase() === 'none') {
      photo = 'default.png'
    } else {
      try {
        await download.image({
          url: photourl,
          dest: `./uploads/Characters/photos/${uid}${path.extname(photourl)}`,
          extractFilename: false
        });
        await photo.delete();
        photo = `${uid}${path.extname(photourl)}`
      } catch (e) {
        await sails.helpers.events.error(e);
        throw new Error(`Unable to download the provided image`);
      }
    }

    // Prompt for a sprite
    var sprite = await prompt(`Ooh, what a good looking character! Now, provide a sprite image as an attachment or a URL to be used with the dialog command. The sprite should look 8-bit / pixelized, ideally back-and-white, look good against a black background, and have a transparent background (unless it's black), or it might not look good on the dialog. (timeout: 3 minutes)`, 180000, false, (message) => message.author.id === inputs.message.author.id && (message.attachments.size > 0 || /(https?:\/\/[^\s]+)/g.test(message.content || message.content.cleanContent.toLowerCase() === 'none')));
    if (sprite.attachments.size > 0) {
      var spriteurl = sprite.attachments.first().url;
    } else {
      var spriteurl = sprite.cleanContent;
    }

    // Download the image locally
    if (spriteurl.toLowerCase() === 'none') {
      sprite = 'default.png'
    } else {
      try {
        await download.image({
          url: spriteurl,
          dest: `./uploads/Characters/sprites/${uid}${path.extname(spriteurl)}`,
          extractFilename: false
        });
        await sprite.delete();
        sprite = `${uid}${path.extname(spriteurl)}`
      } catch (e) {
        await sails.helpers.events.error(e);
        throw new Error(`Unable to download the provided image`);
      }
    }

    // Prompt for pronouns
    var pronouns = await prompt(`Aww how adorable! Now, what pronouns does this character use (such as he/him/his, she/her/hers, or they/them/theirs) ? (timeout: 2 minutes)`, 120000);
    pronouns = pronouns.cleanContent;

    // Prompt for age
    var age = await prompt(`Sweet! How old is this character? (timeout: 2 minutes)`, 120000);
    age = age.cleanContent;

    // Prompt for height
    var height = await prompt(`They say age is your real-life level. How tall is this character? (timeout: 2 minutes)`, 120000);
    height = height.cleanContent;

    // Prompt for appearance
    var appearance = await prompt(`They should play basketball! Provide any text descriptions of the character's appearance. Or, type "none" to leave this blank. (timeout: 10 minutes)`, 600000);
    appearance = appearance.cleanContent;
    if (appearance.toLowerCase() === 'none')
      appearance = ''

    // Prompt for personality
    var personality = await prompt(`Wicked neat! Describe this character's personality. Or, type "none" to leave this blank. (timeout: 10 minutes)`, 600000);
    personality = personality.cleanContent;
    if (personality.toLowerCase() === 'none')
      personality = ''

    // Prompt for likes
    var likes = await prompt(`Haha sounds like the perfect friend! Make a list of things this character likes, or type "none". (timeout: 5 minutes)`, 300000);
    likes = likes.cleanContent;
    if (likes.toLowerCase() === 'none')
      likes = ''

    // Prompt for dislikes
    var dislikes = await prompt(`Kawaii! Make a list of things this character dislikes, or type "none". (timeout: 5 minutes)`, 300000);
    dislikes = dislikes.cleanContent;
    if (dislikes.toLowerCase() === 'none')
      dislikes = ''

    // Prompt for soul type
    var soulType = await prompt(`Ooh, we might be enemies then! What soul type does this character have? Or, type "none" to leave this blank. (timeout: 2 minutes)`, 120000);
    soulType = soulType.cleanContent;
    if (soulType.toLowerCase() === 'none')
      soulType = ''

    // Prompt for max HP
    var maxHP = await prompt(`oooh! If this character has a static max HP that does not change, provide it here. Or, type 0 if this character's static HP should depend on their LVL (standard human Undertale EXP system). (Must be a number, eg 20) (timeout: 2 minutes)`, 120000);
    maxHP = parseInt(maxHP.cleanContent);

    // Prompt for EXP
    var EXP = await prompt(`Specify this character's starting EXP. (Must be a number, eg 20) (timeout: 2 minutes)`, 120000);
    EXP = parseInt(EXP.cleanContent);

    // Prompt for ATK
    var ATK = await prompt(`What is this character's ATK? You should also provide in parenthesis how much of an effect, in HP, the character's ATK has. For example: "10 (2)" (timeout: 2 minutes)`, 120000);
    ATK = ATK.cleanContent;

    // Prompt for DEF
    var DEF = await prompt(`What is this character's DEF? You should also provide in parenthesis how much of an effect, in HP, the character's DEF has. For example: "10 (2)" (timeout: 2 minutes)`, 120000);
    DEF = DEF.cleanContent;

    // Prompt for gold
    var gold = await prompt(`How much G (gold) does this character have? (Must be a number, eg 20) (timeout: 2 minutes)`, 120000);
    gold = gold.cleanContent;

    // Prompt for weapons
    var weapons = await prompt(`Describe the weapon(s) this character uses (or "none" for no weapons). You should put each weapon on a new line with a * or a -. You should also explain how each weapon works, and what effects they have in game play. (timeout: 10 minutes)`, 600000);
    weapons = weapons.cleanContent;
    if (weapons.toLowerCase() === 'none')
      weapons = ''

    // Prompt for armor
    var armor = await prompt(`Describe the armor this character uses (or "none" for no armor). You should put each armor on a new line with a * or a -. You should also explain how each armor works, and what effects they have in game play. (timeout: 10 minutes)`, 600000);
    armor = armor.cleanContent;
    if (armor.toLowerCase() === 'none')
      armor = ''

    // Prompt for extra information
    var extraInfo = await prompt(`Sounds like a real Knight! Finally, provide any additional information about the character not already covered, or type "none". (timeout: 10 minutes)`, 600000);
    extraInfo = extraInfo.cleanContent;
    if (extraInfo.toLowerCase() === 'none')
      extraInfo = ''

    var obj = {
      uid: uid,
      guildID: inputs.message.guild.id,
      userID: owner,
      OC: OC,
      claimable: claimable,
      name: name,
      photo: photo,
      sprite: sprite,
      nicknames: nicknames,
      pronouns: pronouns,
      age: age,
      height: height,
      appearance, appearance,
      personality: personality,
      soulType: soulType,
      HP: maxHP !== 0 ? maxHP : 20,
      maxHP: maxHP,
      EXP: EXP,
      ATK: ATK,
      DEF: DEF,
      gold: gold,
      weapons: weapons,
      armor: armor,
      likes: likes,
      dislikes: dislikes,
      extraInfo: extraInfo
    }

    var maxHP = await sails.helpers.characters.calculateMaxHp(obj)
    obj.HP = maxHP;
    obj.maxHP = maxHP;

    // Create or update the database record
    Caches.get('characters').set([ uid ], () => {
      return obj;
    });

    // Return a message
    return inputs.message.send(`:white_check_mark: Splendid! The character was added! Note, custom dialog fonts must be manually installed by the bot owner. Otherwise, the bot will use the default font of determination.`);

  }


};

