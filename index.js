const { WebhookClient } = require('discord.js')
const providers = {
  borg: require('./providers/borg'),
  restic: require('./providers/restic'),
  file: require('./providers/file')
}

const config = require('./config')

async function main() {
  const webhook = new WebhookClient({ url: config.webhook })
  try {
    const alerts = await getAlerts()
    if (alerts.length === 0) return
    
    await webhook.send(`${config.ping}\n\n${alerts.join('\n\n')}`)
  } catch (error) {
    await webhook.send(`${config.ping} error checking backups: ${error}`)
  }
}

async function getAlerts() {
  const borgAlerts = getBorgAlerts()
  const resticAlerts = getResticAlerts()
  const fileAlerts = getFileAlerts()
  return [await borgAlerts, await resticAlerts, await fileAlerts].filter(alerts => alerts)
}

async function getBorgAlerts() {
  const alerts = await alertMap(config.borg.repos, providers.borg.getRepoAlert)
  if (alerts.length === 0) return
  return `The following borg backups are failing:\n${alerts.join('\n')}`
}

async function getResticAlerts() {
  const alerts = await alertMap(config.restic.repos, providers.restic.getRepoAlert)
  if (alerts.length === 0) return
  return `The following restic backups are failing:\n${alerts.join('\n')}`
}

async function getFileAlerts() {
  const alerts = await alertMap(config.datefile.files, providers.file.getFileAlert)
  if (alerts.length === 0) return
  return `The following health check files are unhealthy:\n${alerts.join('\n')}`
}

async function alertMap(configs, check) {
  return (await Promise.all(configs.map(async config => {
    try {
      return await check(config)
    } catch (error) {
      return `- \`${config.path}\` ${error}`
    }
  }))).filter(alert => alert)
}

main()