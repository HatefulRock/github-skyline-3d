#!/usr/bin/env node
// Pulls the real contribution calendar via GitHub's GraphQL API and writes
// it to public/contributions.json, which the app loads at runtime.
//
// Usage:
//   GITHUB_TOKEN=ghp_xxx node scripts/fetch-data.mjs <username>
//
// The token just needs to be a personal access token with no special scopes
// (public read access is enough) -- create one at
// https://github.com/settings/tokens?type=beta
//
// To see PRIVATE contributions in the output, the target account must have
// "Include private contributions on my profile" enabled in
// https://github.com/settings/profile -- that's a GitHub-side setting, not
// something a token scope can override.

import { writeFile } from "node:fs/promises"

const username = process.argv[2]
const token = process.env.GITHUB_TOKEN

if (!username || !token) {
  console.error("Usage: GITHUB_TOKEN=ghp_xxx node scripts/fetch-data.mjs <username>")
  process.exit(1)
}

const query = `
  query($login: String!) {
    user(login: $login) {
      contributionsCollection {
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays { contributionCount date }
          }
        }
      }
    }
  }
`

const res = await fetch("https://api.github.com/graphql", {
  method: "POST",
  headers: {
    Authorization: `bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ query, variables: { login: username } }),
})

if (!res.ok) {
  console.error(`GitHub API error: ${res.status} ${await res.text()}`)
  process.exit(1)
}

const json = await res.json()
if (json.errors) {
  console.error("GraphQL errors:", json.errors)
  process.exit(1)
}

const cal = json.data.user.contributionsCollection.contributionCalendar
const out = {
  username,
  totalContributions: cal.totalContributions,
  weeks: cal.weeks.map((w) => ({
    days: w.contributionDays.map((d) => ({ date: d.date, count: d.contributionCount })),
  })),
}

await writeFile("public/contributions.json", JSON.stringify(out, null, 2))
console.log(`Wrote public/contributions.json -- ${cal.totalContributions} contributions, ${cal.weeks.length} weeks`)
