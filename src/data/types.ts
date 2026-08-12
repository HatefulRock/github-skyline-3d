export interface ContributionDay {
  date: string
  count: number
}

export interface ContributionWeek {
  days: ContributionDay[]
}

export interface ContributionData {
  username: string
  totalContributions: number
  weeks: ContributionWeek[]
}
