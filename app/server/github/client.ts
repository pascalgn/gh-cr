import { graphql } from "@octokit/graphql";
import { githubToken } from "./githubToken";

let client: typeof graphql | null = null;

/** The authenticated GitHub GraphQL client, created once per process. */
export function githubClient(): typeof graphql {
  if (client === null) {
    client = graphql.defaults({
      headers: { authorization: `token ${githubToken()}` },
    });
  }
  return client;
}
