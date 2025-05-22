const simpleGit = require('simple-git');
const moment = require('moment');
const path = require('path');
const fs = require('fs');

const reposDir = '../GitHub'; // Change this to your local repos directory
const user = 'taskinoz'; // Change this to the desired username

async function getCommitTimes(repoPath) {
  const git = simpleGit(repoPath);
  const log = await git.log({ '--author': user });
  const commitTimes = log.all.map(commit => moment(commit.date));
  return commitTimes;
}

async function calculateTimeSpent() {
  const repoDirs = fs.readdirSync(reposDir).filter(dir => fs.lstatSync(path.join(reposDir, dir)).isDirectory());
  const timeSpent = {};

  for (const repo of repoDirs) {
    const repoPath = path.join(reposDir, repo);
    const commitTimes = await getCommitTimes(repoPath);

    commitTimes.forEach(commitTime => {
      const date = commitTime.format('YYYY-MM-DD');
      if (!timeSpent[repo]) {
        timeSpent[repo] = {};
      }
      if (!timeSpent[repo][date]) {
        timeSpent[repo][date] = [];
      }
      timeSpent[repo][date].push(commitTime);
    });
  }

  // Round the time to the nearest hour and calculate time spent per day
  const roundedTimeSpent = {};
  for (const repo in timeSpent) {
    roundedTimeSpent[repo] = {};
    for (const date in timeSpent[repo]) {
      const commitTimes = timeSpent[repo][date];
      if (commitTimes.length > 1) {
        const firstCommit = commitTimes[commitTimes.length - 1];
        const lastCommit = commitTimes[0];
        const duration = moment.duration(lastCommit.diff(firstCommit));
        const hours = Math.round(duration.asHours());
        roundedTimeSpent[repo][date] = hours;
      } else {
        roundedTimeSpent[repo][date] = 1; // If there's only one commit, count it as 1 hour
      }
    }
  }

  return roundedTimeSpent;
}

calculateTimeSpent().then(timeSpent => {
  console.log('Time spent in each repo (rounded to hours):');
  console.log(JSON.stringify(timeSpent, null, 2));
}).catch(err => {
  console.error('Error calculating time spent:', err);
});
