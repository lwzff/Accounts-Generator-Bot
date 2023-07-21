function loadEvents (client) {
    const ascii = require("ascii-table");
    const fs = require("fs");
    const table = new ascii().setHeading("Events", "Status");

    const folders = fs.readdirSync("./events");

    for (const folder of folders) {
        const files = fs.readdirSync(`./events/${folder}`).filter( (file) => file.endsWith(".js"));
        
        for (const file of files) {
            const event = require(`../events/${folder}/${file}`);

            client.on(event.name, (...args) => event.execute(...args, client));

            table.addRow(file, "✅");
            continue;
        }
    }

    return console.log(table.toString(), "\nLoaded events.")
}

module.exports = { loadEvents };