import { InstanceStatus } from '@companion-module/base'
import type ModuleInstance from './main.js'
import { fetchData } from './requests.js'

export async function CheckConnection(instance: ModuleInstance): Promise<boolean> {
	if (!instance.config.ip || !instance.config.port || !instance.config.username || !instance.secrets.password) {
		instance.updateStatus(InstanceStatus.BadConfig, 'Missing configuration: IP, port, username, or password')
		instance.log('error', ` Missing configuration: IP, port, username, or password`)
		return false
	}

	try {
		const status = await fetchData(instance, '/devices/meta.json', 'GET')
		if (!status) {
			return false
		}
		return true
	} catch (err) {
		//if econnrefused, it is probably the wrong IP/Port or server is down
		instance.updateStatus(InstanceStatus.UnknownError, 'Connection failed - check configuration')
		instance.log('error', `Connection failed: ${err}`)
		return false
	}
}

export async function getAllChannels(instance: ModuleInstance): Promise<any> {
	return await fetchData(instance, '/channels/config.json', 'GET')
}

export async function getChannelStatistics(instance: ModuleInstance, channelId: number): Promise<any> {
	instance.log('debug', `Fetching statistics for channel ${channelId}`)
	return await fetchData(instance, `/channels/statistics/${channelId}.json`, 'GET')
}

export async function enableChannel(instance: ModuleInstance, channelId: number): Promise<any> {
	instance.log('debug', `Enabling channel ${channelId}`)
	return await fetchData(instance, `/channels/command/monitor/${channelId}/.json`, 'GET')
}

export async function disableChannel(instance: ModuleInstance, channelId: number): Promise<any> {
	instance.log('debug', `Disabling channel ${channelId}`)
	return await fetchData(instance, `/channels/command/unMonitor/${channelId}/.json`, 'GET')
}

export async function enableSnooze(instance: ModuleInstance, channelId: number, note: string): Promise<any> {
	instance.log('debug', `Enabling snooze for channel ${channelId} with note: ${note}`)
	return await fetchData(instance, `/channels/command/setSnooze/${channelId}/${note}/.json`, 'GET')
}

export async function disableSnooze(instance: ModuleInstance, channelId: number): Promise<any> {
	instance.log('debug', `Disabling snooze for channel ${channelId}`)
	return await fetchData(instance, `/channels/command/clearSnooze/${channelId}/.json`, 'GET')
}
