import { NotifyClient } from 'notifications-node-client'
import dotenv from 'dotenv'

dotenv.config()

const notifyClient = new NotifyClient(process.env.GOVUK_NOTIFY_API_KEY || 'test-key')

export default notifyClient
