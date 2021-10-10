const { DH_CHECK_P_NOT_PRIME } = require("constants");
const Discord = require("discord.js");
const fs = require('fs');
require('dotenv').config();
const { google } = require('googleapis');
const { ml } = require("googleapis/build/src/apis/ml");
const auth = require('./auth/auth');
const creds = './auth/credentials.json';
const calList = require('./auth/credentials.json');
let calendarMap = new Map();


function parseCalendars() {
  calList.calendars.forEach(calendar => {
    calendarMap.set(calendar.id, calendar.url);
  });
}



const tableMois = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Aout", "Septembre", "Octobre", "Novembre", "Décembre"];
const tableSemaine = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi",];

const myToken = process.env.TOKEN;

const client = new Discord.Client();
const prefix = 'µ';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function listEvents(auth, message, args) {
  const calendar = google.calendar({ version: 'v3', auth });
  let today = new Date();
  let schedule = new Discord.MessageEmbed();
  let nbElements = ((parseInt(args[args.length - 1], 10) > 0) && (parseInt(args[args.length - 1], 10) <= 25)) ? parseInt(args[args.length - 1], 10) : 10;
  let myCurrentTime;
  let details = "";
  if (args[0] != null && calendarMap.has(args[0])) {
    calendarId = calendarMap.get(args[0]);
    schedule.setColor('#0099ff')
      .setTitle(':books: Emploi du temps des ' + args[0] + ' :books:')
    calendar.events.list({
      calendarId: calendarId,
      timeMin: today.toISOString(),
      maxResults: nbElements,
      singleEvents: true,
      orderBy: 'startTime',
    }, (err, res) => {
      if (err) return console.log('API ERROR : ' + err);
      const events = res.data.items;
      if (events.length) {
        schedule.setDescription('Vous avez demandé ' + events.length + ' items.');
        let myLastTime = new Date();
        events.map((event, i) => {
          emojiToUse = (event.summary.endsWith('CM S4') || event.summary.endsWith('CM S3')) ? ':notebook:' : (event.summary.endsWith('EXAM S3') || event.summary.endsWith('EXAM S4')) ? ':mortar_board:' : ':pencil:';
          myCurrentTime = new Date(event.start.dateTime);
          myLastTime = (i == 0) ? myCurrentTime : myLastTime;
          if (myCurrentTime.toLocaleDateString() == myLastTime.toLocaleDateString()) {
            details += (emojiToUse + " " + myCurrentTime.toLocaleTimeString('fr-FR', { hour12: false, timeStyle: 'short', timeZone: 'Europe/Paris' }) + " : " + event.summary + "\n");
          } else {
            schedule.addFields(
              {
                name: tableSemaine[myLastTime.getDay()] + " " + myLastTime.getUTCDate() + " " + tableMois[myLastTime.getMonth()],
                value: details
              });
            details = emojiToUse + " " + myCurrentTime.toLocaleTimeString('fr-FR', { hour12: false, timeStyle: 'short', timeZone: 'Europe/Paris' }) + " : " + event.summary + "\n";
            myLastTime = myCurrentTime;
          }
        });
        schedule.addFields(
          {
            name: tableSemaine[myLastTime.getDay()] + " " + myLastTime.getUTCDate() + " " + tableMois[myLastTime.getMonth()], // to add last item
            value: details
          });
      } else {
        schedule.setDescription("Pas de cours demain bg.");
      }
      message.channel.send(schedule);
    });
  } else {
    message.channel.send("Merci de préciser un emploi du temps valide à afficher, tapez µhelp pour avoir la liste.").then(async sent => { await sleep(3000); sent.delete() });
  }
}


client.on('ready', () => {
  parseCalendars();
  console.log("I'm on");
  client.user.setActivity("µedt pour avoir l'emploi du temps !");
})

client.on('message', async message => {
  if (!message.content.startsWith(prefix) || message.author.bot || message.channel.type === "dm") return;
  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();
  switch (command) {
    case 'edt':
      message.delete();
      fs.readFile(creds, (err, content) => {
        if (err) return console.log('Error loading client secret file:', err);
        auth.authorize(JSON.parse(content), listEvents, message, args);
      });
      break;
    case 'help':
      message.delete();
      let myEmbed = {
        title: 'O SEKOUR',
        color: '0099ff',
        description: 'µ est le préfixe par défaut ! µhelp pour afficher l\'aide !',
        fields: [
          {
            name: 'edt',
            value: 'µedt [nomClasse] [nbItems] - affiche l\'emploi du temps de la classe mentionnée.'
          },
          {
            name: 'list',
            value: 'µlist - affiche les classes disponibles.'
          }
        ]
      };
      message.channel.send({ embed: myEmbed });
      break;
    case 'list':
      message.delete();
      let myDesc = "";
      for (let key of calendarMap.keys()) {
        myDesc += key + "\n";
      }
      listeEmbed = {
        title: 'Liste',
        color: '0099ff',
        description: myDesc
      };
      message.channel.send({ embed: listeEmbed });
      break;
  }
});

client.login(myToken).catch(err => console.log(err));