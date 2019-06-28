const chalk = require("chalk");
const request = require("request");
const schedule = require("node-schedule");
const { exec, spawn } = require("child_process");

const requestLink = "https://api.overwatchleague.com/live-match";
const streamLink = "https://www.twitch.tv/overwatchleague";

let childProcess;

function main() {
  request(requestLink, (err, res, body) => {
    const matchSchedule = JSON.parse(body);
    const nextMatch = matchSchedule.data.nextMatch;

    const nextMatchStartDate = new Date(nextMatch.startDate);
    const nextMatchEndDate = new Date(nextMatch.endDate);

    console.log(
      chalk.blue(`Next match: ${nextMatchStartDate} - ${nextMatchEndDate}`)
    );

    if (nextMatchStartDate > nextMatchEndDate) {
      console.log(chalk.red(Error("Start date is after end date")));
      process.exit(1);
    }

    schedule.scheduleJob(nextMatchStartDate, openStream);
    console.log(chalk.yellow(`Scheduled stream open: ${nextMatchStartDate}`));
    schedule.scheduleJob(nextMatchEndDate, () => childProcess.kill());

    // Wait 20 min to wait for api to update match
    setTimeout(main, 1200000);
  });
}

function openStream() {
  childProcess = spawn("firefox", [streamLink]);
  childProcess.stdout.on("data", data => {
    console.log(chalk.blue(`stdout: ${data}`));
  });
  childProcess.stderr.on("data", data => {
    console.log(chalk.red(`stderr: ${data}`));
  });
}

// Check if match is live now
request(requestLink, (err, res, body) => {
  const matchSchedule = JSON.parse(body);
  const now = new Date();
  const liveMatch = matchSchedule.data.liveMatch;
  if (!liveMatch) {
    main();
  }
  const liveMatchStartDate = new Date(liveMatch.startDate);
  const liveMatchEndDate = new Date(liveMatch.endDate);
  if (now > liveMatchStartDate && now < liveMatchEndDate) {
    // Match is live now!!
    console.log(chalk.yellow("Match live now!"));
    openStream();
    schedule.scheduleJob(liveMatchEndDate, () => childProcess.kill());
    setTimeout(main, 1200000);
  } else {
    // No live match, schedule for next match
    console.log(chalk.yellow("No live match now :("));
    main();
  }
});
