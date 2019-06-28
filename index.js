const chalk = require("chalk");
const request = require("request");
const schedule = require("node-schedule");
const { exec, spawn } = require("child_process");

const requestLink = "https://api.overwatchleague.com/live-match";
const streamLink = "https://www.twitch.tv/overwatchleague";

let childProcess;

function openStream() {
  childProcess = spawn("firefox", [streamLink]);
  childProcess.stdout.on("data", data => {
    console.log(chalk.blue(`stdout: ${data}`));
  });
  childProcess.stderr.on("data", data => {
    console.log(chalk.red(`stderr: ${data}`));
  });
}

function closeStream() {
  childProcess.kill();
  main();
}

function main() {
  request(requestLink, (err, res, body) => {
    const matchSchedule = JSON.parse(body);
    const liveMatch = matchSchedule.data.liveMatch;
    const liveMatchStartDate = new Date(liveMatch.startDate);
    const liveMatchEndDate = new Date(liveMatch.endDate);
    if (liveMatch.liveStatus == "LIVE") {
      console.log(chalk.yellow("Match live now!"));
      openStream();
      schedule.scheduleJob(liveMatchEndDate, closeStream);
      console.log(
        chalk.blue(`Scheduled stream close for: ${chalk.cyan(liveMatchEndDate)}`)
      );
    } else {
      console.log(chalk.yellow("No live match now :("));
      schedule.scheduleJob(liveMatchStartDate, openStream);
      schedule.scheduleJob(liveMatchEndDate, closeStream);
      console.log(
        chalk.blue(`Scheduled stream open for: ${chalk.cyan(liveMatchStartDate)}`)
      );
      console.log(
        chalk.blue(`Scheduled stream close for: ${chalk.cyan(liveMatchEndDate)}`)
      );
    }
  });
}

main();
