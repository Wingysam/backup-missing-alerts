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
  const snapshots = await callResticSnapshots(repo)
  if (snapshots.length === 0) throw new Error('no snapshots found')
  const lastSnapshot = snapshots[snapshots.length - 1]
  return moment(lastSnapshot.time)
}

async function callResticSnapshots(repo) {
  const restic = await spawn('/snap/bin/restic', ['--json', '--no-lock', 'snapshots'], undefined, {
    env: {
      RESTIC_REPOSITORY: `rest:${config.restic.rest}/${repo.path}`,
      RESTIC_PASSWORD: repo.password
    }
  })
  return JSON.parse(restic)
}

module.exports = { getRepoAlert }