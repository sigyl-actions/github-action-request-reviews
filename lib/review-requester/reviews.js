import asyncToArray from '../async-to-array';

export default (octokit) => async ({
  owner,
  repo,
  pull_number,
  lastCommit,
  teams,
}) => {
  const reviews =
    (await asyncToArray(
      octokit.paginate.iterator(
        octokit.rest.pulls.listReviews,
        {
          owner,
          repo,
          pull_number,
        }
      )
    )).flatMap(
      ({
        data,
      }) => data,
    )

  const freshReviews = reviews
    .filter(
      ({
        submitted_at,
      }) => submitted_at > lastCommit,
    );

  const userReviews =
    freshReviews
      .reduce(
        (acc, review) => ({
          ...acc,
          [review.user.login]: review,
        }),
        {},
      )
  const staleReviews = reviews
    .filter(
      ({
        submitted_at,
        state,
      }) => submitted_at <= lastCommit && state === 'APPROVED',
    );
  const latestUserReviews = (
    await Promise.all(
      teams
        .map(
          (team) => Promise.all(
            Object.keys(userReviews)
              .map(
                (login) => octokit.rest.teams.getMembershipForUserInOrg({
                  org: 'gb-org-demo',
                  team_slug: team,
                  username: login,
                }).catch(
                  (ex) => undefined,
                ).then(
                  (result) => ({
                    login,
                    team,
                    result,
                  })
                )
              )
          )
        )
    )
  ).flatMap(
    (team) => team,
  ).filter(
    ({ result }) => result,
  ).map(
    ({
      login,
      team,
    }) => ({
      login,
      team,
      review: userReviews[login],
    })
  )
  const nextTeam = teams
    .find(
      (team) => latestUserReviews
        .find(
          ({
            team: rTeam,
            review: {
              state,
            }
          }) => rTeam === team
            && state === 'CHANGES_REQUESTED'
        )
        || !latestUserReviews
          .find(
            ({
              team: rTeam,
              review: {
                state,
              }
            }) => rTeam === team
              && state === 'APPROVED'
          )
    )
    for (const staleReview of staleReviews) {
      console.log(`dismissing review ${staleReview.id} for ${staleReview.user.login}`);
      await octokit.rest.pulls.dismissReview({
        owner,
        repo,
        pull_number,
        review_id: staleReview.id,
        message: 'this review is dismissed due to more changes being made.',
      });
    }
  return {
    staleReviews,
    nextTeam,
  }
}