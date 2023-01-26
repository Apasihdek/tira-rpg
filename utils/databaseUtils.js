const { Client } = require('discord.js');
const rpgInfoUtils = require('../utils/rpgInfoUtils.js');
const classes = require('../data/classes.json');

// Player data management

exports.doesPlayerExists = async function(id) {
    const playerDatabase = Client.mongoDB.db('player-data');

    const find = await playerDatabase.listCollections({ name: id }).toArray();
    
    return find.length > 0;
}

exports.createPlayer = async function(id) {
    const playerCollection = Client.mongoDB.db('player-data').collection(id);

    const data = [
        { name: "info", class: "noclass", level: 0, exp: 0, health: 10 },
        { name: "stats", strength: 0, vitality: 10, resistance: 0, dexterity: 0, agility: 0, intelligence: 0 },
        { name: "inventory", items: [], skills: [] , activeSkills: []},
        { name: "misc", lastRegen: Date.now()},
    ]

    const options = { ordered: true };
    
    const result = await playerCollection.insertMany(data, options);
    console.log("[DEBUG] User ID " + id + " created.");
}

exports.removePlayer = async function(id) {
    const playerCollection = Client.mongoDB.db('player-data').collection(id);

    const result = await playerCollection.drop();
    console.log("[DEBUG] User ID " + id + " removed.");
}

exports.getPlayerData = async function(id, name) {
    const playerCollection = Client.mongoDB.db('player-data').collection(id);

    const query = { name: name };
    const options = { 
        projection: {_id: 0},
    };

    const result = await playerCollection.findOne(query, options);
    
    return result;
}

exports.setHealth = async function(userID, health) {
    const playerCollection = Client.mongoDB.db('player-data').collection(userID);

    const query = { name: "info" };
    let options = { 
        projection: {_id: 0, class: 0, level: 0, exp: 0},
    };

    const info = await playerCollection.findOne(query, options);

    const update = { $set: { health: health } };
    options = { upsert: true };
    const result = await playerCollection.updateOne(query, update, options);
}

exports.addHeath = async function(userID, health) {
    const playerCollection = Client.mongoDB.db('player-data').collection(userID);

    const query = { name: "info" };
    let options = { 
        projection: {_id: 0, class: 0, level: 0, exp: 0},
    };

    const info = await playerCollection.findOne(query, options);
    const newHealth = info.health + health;
    
    const update = { $set: { health: newHealth } };
    options = { upsert: true };
    const result = await playerCollection.updateOne(query, update, options);
}

exports.passiveRegen = async function(userID) {
    //Math.floor(Date.now()/1000)
    const playerCollection = Client.mongoDB.db('player-data').collection(userID);

    let maxHealth = await exports.getPlayerData(userID, "stats");
    maxHealth = maxHealth.vitality;

    let lastRegen = await exports.getPlayerData(userID, "misc");
    lastRegen = lastRegen.lastRegen;

    let health = await exports.getPlayerData(userID, "info");
    health = health.health;

    if((Date.now() - lastRegen) < 1800000)
        return 0;

    const percHealth = (Date.now() - lastRegen) / 1000000 * 17.778;
    let newHealth = Math.round(health + maxHealth*(percHealth/100));
    if(newHealth > maxHealth)
        newHealth = maxHealth;

    //const newHealth = maxHealth.health + health;

    let query = { name: "info" };
    
    let update = { $set: { health: newHealth } };
    let options = { upsert: true };
    await playerCollection.updateOne(query, update, options);

    console.log(`[DEBUG] User ID ${userID} regenerated ${newHealth - health} through ${(Math.round((Date.now() - lastRegen)/60000))} minutes`);

    query = { name: "misc" };
    
    update = { $set: { lastRegen: Date.now() } };
    await playerCollection.updateOne(query, update, {upsert: true});

    return newHealth - health;
}

exports.awardExp = async function(id, exp, channel) {
    const playerCollection = Client.mongoDB.db('player-data').collection(id);

    const query = { name: "info" };
    let options = { 
        projection: {_id: 0},
    };

    const info = await playerCollection.findOne(query, options);
    const newExp = info.exp + exp;
    const newLevel = rpgInfoUtils.calculateNewLevelExp(info.level, newExp);
    
    const update = { $set: { exp: newLevel.exp, level: newLevel.level } };
    options = { upsert: true };
    const result = await playerCollection.updateOne(query, update, options);

    for(let i=info.level+1; i<=newLevel.level; i++) {
        exports.getNewLevelRewards(id, i, channel);
    }
}

exports.levelUp = async function(id, level) {
    const playerCollection = Client.mongoDB.db('player-data').collection(id);

    var query = { name: "info" };
    const info = await playerCollection.findOne(query);
    const userClass = info.class;

    const strength = classes[userClass].base_stats.strength*1 + Math.floor(((level*1 + (Math.random() * level)*0.1)*classes[userClass].mult_stats.strength)*0.5);
    const vitality = classes[userClass].base_stats.vitality*1 + Math.floor(((level*1 + (Math.random() * level)*0.1)*classes[userClass].mult_stats.vitality)*0.5);
    const resistance = classes[userClass].base_stats.resistance*1 + Math.floor(((level*1 + (Math.random() * level)*0.1)*classes[userClass].mult_stats.resistance)*0.5);
    const dexterity = classes[userClass].base_stats.dexterity*1 + Math.floor(((level*1 + (Math.random() * level)*0.1)*classes[userClass].mult_stats.dexterity)*0.5);
    const agility = classes[userClass].base_stats.agility*1 + Math.floor(((level*1 + (Math.random() * level)*0.1)*classes[userClass].mult_stats.agility)*0.5);
    const intelligence = classes[userClass].base_stats.intelligence*1 + Math.floor(((level*1 + (Math.random() * level)*0.1)*classes[userClass].mult_stats.intelligence)*0.5);

    query = { name: "stats" };
    const update = { $set: { strength: strength,
                             vitality: vitality,
                             resistance: resistance,
                             dexterity: dexterity,
                             agility: agility,
                             intelligence: intelligence, }};
    const result = await playerCollection.updateOne(query, update, {upsert: false});

    
}

exports.getNewLevelRewards = async function(id, level, channel) {
    this.levelUp(id, level);
    if(!channel)
        return;
    channel.send("Vous avez atteint le niveau " + level + " !");
}


exports.setClass = async function(id, className) {
    const playerCollection = Client.mongoDB.db('player-data').collection(id);

    const query = { name: "info" };
    let options = { 
        projection: {_id: 0},
    };

    const info = await playerCollection.findOne(query, options);

    // if(info.class != "noclass") {
    //     return false;
    // }

    const update = { $set: { class: className } };
    options = { upsert: true };
    const result = await playerCollection.updateOne(query, update, options);

    this.updateStats(id, className);

    return true;
}

exports.updateStats = async function(id, className) {
    const playerCollection = Client.mongoDB.db('player-data').collection(id);

    console.log(classes[className]);

    const strength = classes[className].base_stats.strength;
    const vitality = classes[className].base_stats.vitality;
    const resistance = classes[className].base_stats.resistance;
    const dexterity = classes[className].base_stats.dexterity;
    const agility = classes[className].base_stats.agility;
    const intelligence = classes[className].base_stats.intelligence;

    console.log(strength);

    const query = { name : "stats"};
    const update = { $set: { strength: strength,
                             vitality: vitality,
                             resistance: resistance,
                             dexterity: dexterity,
                             agility: agility,
                             intelligence: intelligence, }};
    const result = await playerCollection.updateOne(query, update, {upsert: false});

    console.log(result);

    return true;
    
}