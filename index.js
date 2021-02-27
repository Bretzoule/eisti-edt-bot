const Discord = require("discord.js");
const fs = require('fs');
const { google } = require('googleapis');
const auth = require('./auth/auth');
const creds = './auth/credentials.json';

const client = new Discord.Client();


const myEmojiArray = [":one:", ":two:", ":three:", ":four:",":five:", ":six:", ":seven:", ":eight:", ":nine:"];

const myToken = process.env.TOKEN;
const prefix = 'µ';

fs.readFile(creds, (err, content) => {
  if (err) return console.log('Error loading client secret file:', err);
  auth.authorize(JSON.parse(content), listEvents);
});


function listEvents(auth) {
  const calendar = google.calendar({ version: 'v3', auth });
  let today = new Date();
  let tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate + 1,0,0,0);
  let schedule = new Discord.MessageEmbed()
  calendar.events.list({
    calendarId: 'c_4c9sl9jjagkgdibl4450u1h038@group.calendar.google.com',
    timeMin: today.toISOString,
    maxResults: 8,
    timeMax: tomorrow.toISOString,
    singleEvents: true,
    orderBy: 'startTime',
  }, (err, res) => {
    if (err) return console.log('API ERROR : ' + err);
    const events = res.data.items;
    if (events.length) {
      console.log('Les cours de demain :');
      schedule.setColor('#0099ff')
      .setTitle(':books: Emploi du temps des ING1-GI1 :books:')
      .setDescription('Pour le ' + today.toLocaleDateString)
      events.map((event, i) => {
        const start = event.start.dateTime;
        let myCurrentTime = new Date(start);
        schedule.addfields({name: myEmojiArray[i] + " : " + myCurrentTime.toTimeString, value: event.summary });
      });
    } else {
      schedule.setTitle("Pas de cours demain bg...").setColor('#0099ff');
    }
    message.channel.send(schedule);
  });
}