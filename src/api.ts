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

export async function getDeviceConfig(instance: ModuleInstance): Promise<any> {
	instance.log('debug', `Fetching Devices`)
	const devices = await fetchData(instance, `/devices/.json`, 'GET')
	for (const device of devices) {
		if (device.Device.is_conected_device == 1) {
			return device.Device
		}
	}
	return false
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
	return await fetchData(instance, `/channels/command/monitor/${channelId}//.json`, 'GET')
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

export async function getAllEvents(instance: ModuleInstance): Promise<any> {
	instance.log('debug', `Fetch all current events on the device`)
	return await fetchData(instance, `/channels/events.json`, 'GET')
}

export async function getChannelEvents(instance: ModuleInstance, channelId: number): Promise<any> {
	//instance.log('debug', `Fetch all current events on channel ${channelId}`)
	const events = await getAllEvents(instance)

	const channelEvents = []
	for (const event of events) {
		if (event.ChannelEvent.channel_source_id == channelId) {
			channelEvents.push(event.ChannelEvent)
		}
	}
	if (!channelEvents) {
		return false
	}

	return channelEvents
}

/* // The call don't seems to work...
export async function acknowledgeChannelEvents(instance: ModuleInstance, channelId: number): Promise<any> {
    instance.log('debug', `Acknowledge all events on channel ${channelId}`)
	return await fetchData(instance, `/channels/command/acknowledge/${channelId}.json`, 'POST')
} */

export async function acknowledgeChannelEvents(instance: ModuleInstance, channelId: number): Promise<any> {
	instance.log('debug', `Acknowledge all events on channel ${channelId}`)
	const channelEvents = await getChannelEvents(instance, channelId)

	instance.log('debug', `No events to acknowledge on channel ${JSON.stringify(channelEvents)}`)
	if (!channelEvents) {
		return
	}

	for (const event of channelEvents) {
		const res = await fetchData(instance, `/channels/command/acknowledge/${channelId}/${event.id}.json`, 'GET')
		instance.log('debug', `${JSON.stringify(res)}`)
	}
}
