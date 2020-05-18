const { registerFont, createCanvas, loadImage } = require('canvas')
const fs = require('fs');
const path = require('path');
const sanitize = require("sanitize-filename");

module.exports = {


  friendlyName: 'commands.dialog',


  description: 'Undertale dialog generator.',


  inputs: {
    message: {
      type: 'ref',
      required: true,
      description: 'The message that triggered the command'
    },
    character: {
      type: 'string',
      required: true,
      description: 'The name of the character in the database to generate a dialog.'
    },
    text: {
      type: 'string',
      required: true,
      description: 'The text to put in the dialog.',
      maxLength: 256
    }
  },


  exits: {

  },


  fn: async function (inputs) {

    // Check if provided character exists. Error if it does not.
    var character = inputs.message.guild.characters.find((character) => character.name.toLowerCase() === inputs.character.toLowerCase())
    if (!character) {
      throw new Error("The character name you provided does not exist.")
    }

    // Register character font
    registerFont(`./assets/fonts/${character.font}.otf`, { family: character.font });

    // Create a new canvas
    var canvas = createCanvas(400, 100);
    var ctx = canvas.getContext('2d');

    // Load the dialog background image
    var imageBg = await loadImage(`./assets/images/Characters/base/dialog.png`);
    ctx.drawImage(imageBg, 0, 0, 400, 100);

    // Load the character sprite
    var imageSprite = await loadImage(`./assets/images/Characters/sprites/${sanitize(character.sprite)}`);
    var width = imageSprite.width;
    var height = imageSprite.height;
    if (width > height) {
      height = height * (75 / width);
      width = 75;
    } else {
      width = width * (75 / height);
      height = 75;
    }
    ctx.drawImage(imageSprite, 12 + (width - 75), 12 + (height - 75), width, height);

    // Add text
    var lines = wrapText(ctx, inputs.text, 296);
    ctx.font = `16px ${character.font}`;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(lines, 96, 20);

    // Return with attachment message
    return inputs.message.send(``, {files: [{attachment: canvas.toBuffer(), name: 'UndertaleDialog.png'}]});
  }


};

function wrapText (ctx, text, maxWidth) {
  const words = text.split(' ');
  let lines = [];
  let line = '';

  if (ctx.measureText(text).width < maxWidth) {
    return [ text ];
  }

  while (words.length > 0) {
    let split = false;

    while (ctx.measureText(words[ 0 ]).width >= maxWidth) {
      const tmp = words[ 0 ];
      words[ 0 ] = tmp.slice(0, -1);

      if (!split) {
        split = true;
        words.splice(1, 0, tmp.slice(-1));
      }
      else {
        words[ 1 ] = tmp.slice(-1) + words[ 1 ];
      }
    }

    if (ctx.measureText(line + words[ 0 ]).width < maxWidth) {
      line += `${words.shift()} `;
    }
    else {
      lines.push(line);
      line = '';
    }

    if (words.length === 0) {
      lines.push(line);
    }
  }

  return lines;
}