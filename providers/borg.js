const spawn = require('spawn-please')
const moment = require('moment')
const path = require('path')

const config = require('../config')

async function getRepoAlert(repo) {
  const lastBackup = await getLastBackup(repo)
  const shouldAlert = lastBackup.isBefore(repo.threshold)
  if (!shouldAlert) return

  const sinceBackup = lastBackup.fromNow()
  return `- \`${repo.path}\` no backups since ${sinceBackup}`
}

async function getLastBackup(repo) {
  const { archives } = await callBorgList(repo)
  if (archives.length === 0) throw new Error('no archives found')
  const lastArchive = archives[archives.length - 1]
  return moment(lastArchive.time)
}

async function callBorgList(repo) {
  const borg = await spawn('/usr/bin/borg', ['list', repo.path, '--json', '--lock-wait', `${config.borg.lockTimeout}`], undefined, {
    cwd: config.borg.root,
    env: {
      BORG_PASSPHRASE: repo.passphrase
    }
  })
  return JSON.parse(borg)
}

module.exports = { getRepoAlert }