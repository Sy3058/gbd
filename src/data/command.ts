export const COMMIT_MESSAGES: { message: string; display: string }[] = [
  { message: "fix login validation", display: "fix login validation" },
  { message: "add user authentication", display: "add user auth" },
  { message: "update payment gateway", display: "update payment" },
  { message: "refactor database queries", display: "refactor DB" },
  { message: "remove deprecated API", display: "remove old API" },
  { message: "add error handling", display: "add error handling" },
  { message: "fix memory leak", display: "fix memory leak" },
  { message: "update dependencies", display: "update deps" },
  { message: "add unit tests", display: "add unit tests" },
  { message: "fix typo in README", display: "fix README typo" },
  { message: "implement dark mode", display: "add dark mode" },
  { message: "optimize bundle size", display: "optimize bundle" },
  { message: "add loading spinner", display: "add spinner" },
  { message: "fix race condition", display: "fix race condition" },
  { message: "add input validation", display: "add validation" },
  { message: "migrate to TypeScript", display: "migrate to TS" },
  { message: "fix CORS issue", display: "fix CORS" },
  { message: "add pagination", display: "add pagination" },
  { message: "implement caching", display: "add cache" },
  { message: "fix null pointer", display: "fix null pointer" },
  { message: "add rate limiting", display: "add rate limit" },
  { message: "update security patch", display: "security patch" },
  { message: "fix infinite loop", display: "fix infinite loop" },
  { message: "add search feature", display: "add search" },
  { message: "refactor auth middleware", display: "refactor auth" },
  { message: "fix timezone bug", display: "fix timezone" },
  { message: "add webhook support", display: "add webhooks" },
  { message: "optimize SQL queries", display: "optimize SQL" },
  { message: "fix file upload", display: "fix upload" },
  { message: "add email notifications", display: "add emails" },
];

// 명령어 생성 헬퍼
export function generateCommitCommand(message: string): string {
  return `git commit -m "${message}"`;
}

export function generateMergeCommand(branch: string): string {
  return `git merge ${branch}`;
}
