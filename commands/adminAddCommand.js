const { Client, MessageEmbed } = require('discord.js');
const permsUtils = require('../utils/permsUtils.js');

module.exports = {
    name : "add",
    aliases: [],
<<<<<<< HEAD
    requiredPermission: ["admin.add"],
    description: "Ajouter des permissions admin à une commande",
=======
    description: "",
>>>>>>> origin/main

    execute(message, args) {
        console.log(args);

        if (args.length < 1)
            return;

<<<<<<< HEAD
        permsUtils.addAdmin(args[0]);
        message.reply('debug: added admin permission');
=======
        permsUtils.addAdmin(args);
        message.reply('debug: added admin perm to command');
>>>>>>> origin/main

        // dbUtils.doesCommandExists(args).then(exists => {
        //     if(!exists) {
        //         dbUtils.addAdmin(args);
        //         message.reply('debug: added admin perm to command');
        //     } else {
        //         message.reply('debug: command already has admin perm ');
        //     }
        // });
    }
}