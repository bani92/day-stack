import type { DailyLog } from './daily-log'

export type SearchField = 'done' | 'learned' | 'blocked' | 'next'

export interface SearchResult {
  log: DailyLog
  matchedFields: SearchField[]
  excerpt: string
}

const SEARCH_FIELDS: SearchField[] = ['done', 'learned', 'blocked', 'next']
const EXCERPT_LIMIT = 120

function normalizeQuery(query: string): string {
  return query.trim().toLocaleLowerCase('ko-KR')
}

function normalizeValue(value: string): string {
  return value.toLocaleLowerCase('ko-KR')
}

function createExcerpt(value: string): string {
  const trimmed = value.trim()

  if (trimmed.length <= EXCERPT_LIMIT) {
    return trimmed
  }

  return `${trimmed.slice(0, EXCERPT_LIMIT)}…`
}

function getMatchedFields(log: DailyLog, normalizedQuery: string): SearchField[] {
  if (normalizedQuery === '') {
    return SEARCH_FIELDS.filter(field => log[field].trim() !== '')
  }

  return SEARCH_FIELDS.filter(field => normalizeValue(log[field]).includes(normalizedQuery))
}

export function searchLogs(logs: DailyLog[], query: string): SearchResult[] {
  const normalizedQuery = normalizeQuery(query)

  return logs
    .map(log => {
      const matchedFields = getMatchedFields(log, normalizedQuery)

      if (normalizedQuery !== '' && matchedFields.length === 0) {
        return null
      }

      const excerptField = matchedFields[0]

      return {
        log,
        matchedFields,
        excerpt: excerptField ? createExcerpt(log[excerptField]) : '',
      }
    })
    .filter((result): result is SearchResult => result !== null)
    .sort((left, right) => right.log.date.localeCompare(left.log.date))
}
