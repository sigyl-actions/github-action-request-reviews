export default (octokit) => async ({
  owner,
  repo,
  pull_number,
}) => {
  const {
    data: {
      state,
      requested_reviewers,
      requested_teams,
      head: {
        sha,
      },
    },
  } = await octokit.rest.pulls.get({
    owner,
    repo,
    pull_number,
  })

  const requestedReviewers = requested_reviewers
    .map(
      ({ login }) => login,
    );
  const requestedTeams = requested_teams
    .map(
      ({ slug }) => slug,
    );  
  return {
    requestedReviewers,
    requestedTeams,
    state,
    sha
  }
};
