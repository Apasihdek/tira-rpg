const player = require('../utils/playerUtils');

module.exports = {
  name: "delete",
  aliases: [],
  description: "",
  execute(message, args) {

    if (args.length >= 1)
      var arg = message.mentions.members.first();
    else
      var arg = message.author;

    if (!arg)
      return;

    const id = arg.id;
    
    player.doesExists(id).then(exists => {
      if (exists) {
        player.remove(id);
        message.reply('debug: deleted player');

        return;

      } else {

        message.reply('debug: no player to delete');
        return;
      }
    });
  }
}