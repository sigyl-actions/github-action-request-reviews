import * as core from '@actions/core';

import pr from './pr';
import commit from './commit';
import reviews from './reviews';

export default (octokit) => async ({
  teams,
  owner,
  repo,
  pull_number,
}) => {
  const {
    requestedReviewers,
    requestedTeams,
    state,
    sha,
  } = await pr(octokit)({
    owner,
    repo,
    pull_number,
  });

  if (state !== 'open') {
    console.log(`pr state is '${state}', nothing to do..`);
    return;
  }
  const {
    lastCommit,
  } = await commit(octokit)({
    owner,
    repo,
    sha,
  })

  const {
    nextTeam,
  } = await reviews(octokit)({
    owner,
    repo,
    pull_number,
    lastCommit,
    teams,
  });

  const teamsToRemove = requestedTeams
    .filter(
      (team) => team !== nextTeam,
    )
  console.log({
    sha,
    teams,
    nextTeam,
    lastCommit,
    requestedReviewers,
    requestedTeams,
    teamsToRemove,
  });
  if (teamsToRemove.length) {
    console.log('removing teams', teamsToRemove);
    octokit.rest.pulls.removeRequestedReviewers({
      owner,
      repo,
      pull_number,
      reviewers: [],
      team_reviewers: teamsToRemove,
    });
  }
  if(nextTeam) {
    core.setOutput('more', 'true')
  }
  if (nextTeam && requestedTeams.indexOf(nextTeam) === -1) {
    console.log(`requesting team: '${nextTeam}'`);
    await octokit.rest.pulls.requestReviewers({
      owner,
      repo,
      pull_number,
      team_reviewers: [nextTeam]
    });
    core.setOutput('more', 'true')
  }
  else {
    if (nextTeam) {
      console.log(`team: '${nextTeam}' already requested, doing nothing`)
    } else {
      console.log('no more teams to review');
      core.setOutput('more', 'false')
    }
  }
};