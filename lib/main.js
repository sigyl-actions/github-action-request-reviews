import 'dotenv/config';
import * as core from '@actions/core';
import * as github from '@actions/github';

import { Octokit } from '@octokit/rest';
import slugify from 'slugify';
import reviewRequester from './review-requester/index.js'
;

async function run() {

  try {
    const octokit = new Octokit({
      auth: core.getInput('token') || process.env.TOKEN,
    });

    const [owner, repo] = (
      core.getInput('repository')
      || github?.context?.payload?.repository?.full_name
      || process.env.REPO
    ).split("/");
    const teams = (core.getInput('teams')
      ? core.getInput('teams').split(',')
      : process.env.TEAMS.split(',')).map((s) => s.trim()).map(slugify);
    console.log({
      teams,
      owner,
      repo,
      pull_number: core.getInput('pr') || process.env.PR,
    })

    await reviewRequester(octokit)({
      teams,
      owner,
      repo,
      pull_number: core.getInput('pr') || process.env.PR,
    })
  }
  catch (error) {
    console.error(error)
    core.setFailed(error.message);
  }
}

run()
