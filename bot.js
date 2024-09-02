// bot.js

const tmi = require('tmi.js');
require('dotenv').config();

// Global variables to store team data and poll data
let teamAssignments = {};
let pollActive = false;
let pollVotes = {};

// Bot configuration
const client = new tmi.Client({
    options: { debug: true },
    connection: {
        reconnect: true,
        secure: true
    },
    identity: {
        username: process.env.TWITCH_BOT_USERNAME,
        password: process.env.TWITCH_OAUTH_TOKEN
    },
    channels: [process.env.CHANNEL]
});

client.connect();

// Assign viewers to teams when they join
client.on('join', (channel, username, self) => {
    if (self) return;

    if (!teamAssignments[username]) {
        const team = Object.keys(teamAssignments).length % 2 === 0 ? 'team1' : 'team2';
        teamAssignments[username] = team;
    }
});

// Reset teams
client.on('chat', (channel, user, message, self) => {
    if (self) return;

    const isBotCommand = message.startsWith('!');

    if (isBotCommand) {
        const command = message.toLowerCase();

        if (command === '!resetteams') {
            teamAssignments = {};
            client.say(channel, 'Teams have been reset!');
        }

        if (command === '!team1poll') {
            startPoll(channel, 'team1');
        }

        if (command === '!team2poll') {
            startPoll(channel, 'team2');
        }

        if (command === '!team') {
            const team = teamAssignments[user.username];
            if (team) {
                client.whisper(user.username, `You are on ${team}.`);
            } else {
                client.whisper(user.username, 'You are not assigned to a team.');
            }
        }
    }
});

// Start a poll
function startPoll(channel, team) {
    if (pollActive) {
        client.say(channel, 'A poll is already active. Please wait.');
        return;
    }

    pollActive = true;
    pollVotes = { A: 0, B: 0, C: 0, D: 0 };

    client.say(channel, `${team.charAt(0).toUpperCase() + team.slice(1)} poll started! Type A, B, C, or D to vote!`);

    setTimeout(() => {
        pollActive = false;
        const winningOption = Object.keys(pollVotes).reduce((a, b) => pollVotes[a] > pollVotes[b] ? a : b);
        client.say(channel, `${team.charAt(0).toUpperCase() + team.slice(1)} poll ended! The winning option is ${winningOption}.`);
    }, 15000);
}

// Count votes
client.on('chat', (channel, user, message, self) => {
    if (self || !pollActive) return;

    const team = teamAssignments[user.username];
    const vote = message.toUpperCase();
    if (team && pollVotes[vote] !== undefined) {
        pollVotes[vote]++;
    }
});
