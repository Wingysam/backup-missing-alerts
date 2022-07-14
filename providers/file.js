const fs = require('fs/promises')
const moment = require('moment')
const path = require('path')

const config = require('../config')

async function getFileAlert(fileConfig) {
  const lastBackup = await getLastBackup(fileConfig)
  const shouldAlert = lastBackup.isBefore(fileConfig.threshold)
  if (!shouldAlert) return

  const sinceBackup = lastBackup.fromNow()
  return `- \`${fileConfig.path}\` no backups since ${sinceBackup}`
}

async function getLastBackup(fileConfig) {
  const filePath = path.join(config.datefile.root, fileConfig.path)
  const content = (await fs.readFile(filePath)).toString().trim()
  const date = moment(content, fileConfig.format)
  if (!date.isValid()) throw new Error(`${filePath}: invalid date`)
  return date
}

module.exports = { getFileAlert }