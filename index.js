const Discord = require("discord.js");
const fs = require('fs');
require('dotenv').config();
const { google } = require('googleapis');
const { ml } = require("googleapis/build/src/apis/ml");
const auth = require('./auth/auth');
const creds = './auth/credentials.json';

let calendarArray = {};
calendarArray['ing1gi1'] = 'c_4c9sl9jjagkgdibl4450u1h038@group.calendar.google.com';

const tableMois = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Aout", "Septembre", "Octobre", "Novembre", "Décembre"];
const tableSemaine = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi",];

const myToken = process.env.TOKEN;

const client = new Discord.Client();
const prefix = 'µ';

function listEvents(auth, message, args) {
  const calendar = google.calendar({ version: 'v3', auth });
  let today = new Date();
  // let tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2, 0, 0, 0);
  // let nextTomorrow = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate() + 2, 0, 0, 0);
  let schedule = new Discord.MessageEmbed();
  let nbElements = ((parseInt(args[args.length - 1], 10) > 0) && (parseInt(args[args.length - 1], 10) < 25)) ? parseInt(args[args.length - 1], 10) : 8;
  console.log(nbElements);
  if (args[0] != null && typeof calendarArray[args[0]] !== undefined) {
    calendarId = calendarArray[args[0]];
    schedule.setColor('#0099ff')
      .setTitle(':books: Emploi du temps des ' + args[0] + ' :books:')
    calendar.events.list({
      calendarId: calendarId,
      timeMin: today.toISOString(),
      maxResults: 15,
      singleEvents: true,
      orderBy: 'startTime',
    }, (err, res) => {
      if (err) return console.log('API ERROR : ' + err);
      const events = res.data.items;
      if (events.length) {
        schedule.setDescription('Vous avez demandé ' + nbElements + ' items.');
        events.map((event, i) => {
          const start = event.start.dateTime;
          let details = event.summary;
          let myCurrentTime = new Date(start);
          emojiToUse = details.endsWith('CM') ? ':notebook:' : details.endsWith('EXAM') ? ':mortar_board:' : ':pencil:';
          schedule.addFields(
            {
              name: emojiToUse + ' : ' + " le " + tableSemaine[myCurrentTime.getDay()] + " " + myCurrentTime.getUTCDate() + " " + tableMois[myCurrentTime.getMonth()] + ' à ' + myCurrentTime.getUTCHours() + ":" + myCurrentTime.getUTCMinutes(),
              value: details
            }
          );
        });
      } else {
        schedule.setDescription("Pas de cours demain bg.");
      }
      message.channel.send(schedule);
    });
  } else {
    message.channel.send("Merci de préciser un emploi du temps valide à afficher, tapez µhelp pour avoir la liste.");
  }
}


client.on('ready', () => {
  console.log("I'm on");
  client.user.setActivity("µedt pour avoir l'emploi du temps !");
})

client.on('message', async message => {
  if (!message.content.startsWith(prefix) || message.author.bot || message.channel.type === "dm") return;
  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();
  switch (command) {
    case 'edt':
      fs.readFile(creds, (err, content) => {
        if (err) return console.log('Error loading client secret file:', err);
        auth.authorize(JSON.parse(content), listEvents, message, args);
      });
      break;
    case 'help':

      break;
  }
});

client.login(myToken).catch(err => console.log(err));