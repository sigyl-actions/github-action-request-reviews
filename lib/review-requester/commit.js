export default (octokit) => async ({
  owner,
  repo,
  sha,
}) => {
  const {
    data: {
      committer: {
        date: lastCommit,
      },
    },
  } = await octokit.rest.git.getCommit({
    owner,
    repo,
    commit_sha: sha,
  });
  return {
    lastCommit,
  };
};
