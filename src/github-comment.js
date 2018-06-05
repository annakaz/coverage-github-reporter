const { resolve } = require('path')
const { Bot } = require('./bot')
const { parseFile } = require('./coverage/parse')
const { format } = require('./coverage/format')

exports.formatComment = function ({
  formatted: {
    status,
    changed,
    folders
  },
  baseArtifactUrl,
  buildNum,
  buildUrl,
  priorBuildNum,
  priorBuildUrl,
  branch
}) {
  return `
**[Code Coverage](${baseArtifactUrl}/index.html): ${status}** 
${changed}
<details>
<summary><strong>🗂 Folder Coverage</strong></summary>
${folders}
</details>
<p>

From **Circle CI [build ${buildNum}](${buildUrl})** ${priorBuildNum
    ? `compared to [build ${priorBuildNum}](${priorBuildUrl}) (from \`${branch}\` branch)`
    : ''} – 🤖[coverage-github-reporter](https://github.com/vivlabs/coverage-github-reporter)`
}

exports.postComment = function postComment ({
  coverageJsonFilename = 'coverage/coverage-final.json',
  coverageHtmlRoot = 'coverage/lcov-report',
  defaultBaseBranch = 'master',
  coverageMethod = 'simple',
  root = process.cwd()
}) {
  const bot = Bot.create()

  const coverage = parseFile(root, resolve(root, coverageJsonFilename, coverageMethod))

  const branch = bot.getBaseBranch(defaultBaseBranch)
  const { priorCoverage, priorBuild } = bot.getPriorBuild(branch, coverageJsonFilename, coverageMethod)

  if (!priorCoverage) {
    console.log(`No prior coverage found`)
  }

  const baseArtifactUrl = bot.artifactUrl(`/${coverageHtmlRoot}`)
  const text = exports.formatComment({
    formatted: format(coverage, priorCoverage, baseArtifactUrl),
    baseArtifactUrl,
    buildNum: process.env.CIRCLE_BUILD_NUM,
    buildUrl: process.env.CIRCLE_BUILD_URL,
    priorBuildNum: priorBuild,
    priorBuildUrl: process.env.CIRCLE_BUILD_URL.replace(/\/\d+$/, `/${priorBuild}`),
    branch
  })

  const result = JSON.parse(bot.comment(text))
  return result && result.html_url
}
