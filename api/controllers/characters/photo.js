var path = require("path");
var fs = require("fs");

// This action must be a classic action due to the need for res.writeHead
module.exports = async function welcomeUser(req, res) {
  // Get uid
  var uid = req.param("uid");

  // uid not defined?
  if (!uid) {
    return res.badRequest(new Error("No character uid specified!"));
  }

  // Find character
  var character = await sails.models.characters.findOne({ uid: uid });
  if (!character) {
    return res.badRequest(
      new Error("A character with the provided uid was not found!")
    );
  }

  // Load the photo
  var photo = fs.readFileSync(
    `${process.cwd()}/uploads/Characters/photos/${character.photo}`
  );

  // Respond with the photo
  res.writeHead(200, {
    "Content-type": `image/${path.extname(character.photo).replace(".", "")}`
  });
  return res.end(photo);
};
