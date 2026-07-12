import { InstanceStatus } from '@companion-module/base'
import type ModuleInstance from './main.js'
import { fetchData } from './requests.js'
import { CheckConnection, getDeviceConfig } from './api.js'
import { decodeCharCodes } from './util.js'

export function startSync(instance: ModuleInstance, interval = 5000): void {
	instance.log('debug', `Starting to sync with device every ${interval} ms`)

	instance.syncIntervalId = setInterval(() => {
		syncData(instance).catch((err) => {
			instance.log('error', `Sync failed: ${err}`)
			stopSync(instance)
		})
	}, interval)

	void syncData(instance)
}

export function stopSync(instance: ModuleInstance): void {
	instance.log('debug', 'Stopping sync with device')

	if (instance.syncIntervalId) {
		clearInterval(instance.syncIntervalId)
		instance.syncIntervalId = undefined
	}
}

export async function syncData(instance: ModuleInstance): Promise<void> {
	instance.log('debug', 'Syncing data with device...')
	try {
		// Check connection before syncing
		if (!(await CheckConnection(instance))) {
			return
		}
		// Fetching data
		const channels = await fetchData(instance, '/channels/config.json', 'GET')
		const deviceConfig = await getDeviceConfig(instance)

		// Error handling
		if (!channels) {
			throw new Error('Sync failed: Failed to get channels from the device')
		}
		if (!deviceConfig) {
			throw new Error('Sync failed: Failed device config')
		}

		if (!Array.isArray(channels)) {
			throw new Error('Sync failed: Invalid channels data received')
		}

		let isChanged = false

		if (JSON.stringify(instance.channels) !== JSON.stringify(channels)) {
			// Update channels
			instance.log('debug', 'Channels changed; updating actions, variables, feedbacks')
			isChanged = true

			instance.channels = channels
			instance.channelsDropdown = parseChannelsDropdown(channels)
		}

		if (JSON.stringify(instance.deviceConfig) !== JSON.stringify(deviceConfig)) {
			// Update device
			instance.log('debug', 'Device changed; updating...')
			isChanged = true

			instance.deviceConfig = deviceConfig
		}

		if (isChanged) {
			instance.updateActions() // export actions
			instance.updateVariableDefinitions() // export variable definitions
			instance.updateFeedbacks() // check all feedbacks to update their state
		}
	} catch (e) {
		//if fetch failed, network error, etc
		instance.updateStatus(InstanceStatus.ConnectionFailure, 'Sync to device failed: Failed to get data from the device')
		instance.log('debug', `Sync to device failed: Failed to get data from  the device: ${e}`)
	}
}

function parseChannelsDropdown(channels: any[]): any[] {
	return channels.map((channel) => ({
		id: channel.ChannelSource.id,
		label: decodeCharCodes(channel.ChannelSource.title),
	}))
}
