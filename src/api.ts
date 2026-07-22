import { InstanceStatus } from '@companion-module/base'
import type ModuleInstance from './main.js'
import { fetchData, putData } from './requests.js'
import { daysToBinaryString, type Days } from './util.js'

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

export async function getChannelConfig(instance: ModuleInstance, channelId: number): Promise<any> {
	return await fetchData(instance, `/channels/config/${channelId}/.json`, 'GET')
}

export async function setChannelSetting(
	instance: ModuleInstance,
	channelId: number,
	key: string,
	value: string | any,
): Promise<any> {
	instance.log('debug', `put setting for channel ${channelId}`)
	const channel = await getChannelConfig(instance, channelId)

	if (!(key in channel.ChannelSource)) {
		return
	}

	channel.ChannelSource[key] = value

	return await putData(instance, `/channels/config/${channelId}/.json`, 'PUT', JSON.stringify(channel))
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

export async function getChannelProfiles(instance: ModuleInstance, channelId: number): Promise<any> {
	const channelStatistics = await getChannelStatistics(instance, channelId)

	if (!channelStatistics.ChannelStatistics.ChannelProfile) {
		return false
	}

	return channelStatistics.ChannelStatistics.ChannelProfile
}

export async function getChannelProfileId(
	instance: ModuleInstance,
	channelId: number,
	profileName: string,
): Promise<number> {
	const channelProfiles = await getChannelProfiles(instance, channelId)

	if (!channelProfiles) {
		return -1
	}

	let profileId = -1
	for (const profile of channelProfiles) {
		if (String(profile.title).includes(profileName)) {
			profileId = profile.id
			break
		}
	}

	if (profileId == -1) {
		instance.log('error', `Profile ${profileName} not found in channel ${channelId} profiles`)
		return -1
	}

	return profileId
}

export async function forceChannelProfile(
	instance: ModuleInstance,
	channelId: number,
	profileId: number,
): Promise<any> {
	instance.log('debug', `Force profile ${profileId} on channel ${channelId}`)
	return await fetchData(instance, `/channels/command/forceProfile/${channelId}/${profileId}/.json`, 'GET')
}

export async function releaseChannelProfile(instance: ModuleInstance, channelId: number): Promise<any> {
	instance.log('debug', `Release profile on channel ${channelId}`)
	return await fetchData(instance, `/channels/command/forceProfile/${channelId}/0/.json`, 'GET')
}

export async function getChannelEventScheduleId(
	instance: ModuleInstance,
	channelId: number,
	eventName: string,
): Promise<number | number[]> {
	const channel = await getChannelConfig(instance, channelId)
	if (!channel.ChannelSource) {
		return -1
	}

	const profiles: Array<any> = channel.ChannelSource.ChannelProfile

	return profiles.flatMap((profile) =>
		profile.ProfileEvents.filter((event: any) => event.name == eventName).map((event: any) => event.id),
	)
}

export async function addChannelEventSchedule(
	instance: ModuleInstance,
	channelId: number,
	profileId: number,
	eventName: string,
	eventPriority: number,
	eventStartTime: number,
	eventDuration: number,
	eventEndTime: number,
	eventDays: Days[],
): Promise<any> {
	const channel = await getChannelConfig(instance, channelId)
	if (!channel.ChannelSource) {
		return
	}

	const profiles: Array<any> = channel.ChannelSource.ChannelProfile

	for (const [i, profile] of profiles.entries()) {
		if (profile.id != profileId) {
			continue
		}

		const event: Record<string, any> = {
			id: '',
			priority: eventPriority,
			start_utc: String(eventStartTime),
			duration_millisecond: eventDuration,
			days_of_week: daysToBinaryString(eventDays),
			valid_until_utc: String(eventEndTime),
			title: eventName,
		}

		Array.prototype.push.call(profiles[i].ProfileEvent, event)
		return await setChannelSetting(instance, channelId, 'ChannelProfile', profiles)
	}
}

export async function removeChannelEventSchedule(
	instance: ModuleInstance,
	channelId: number,
	eventId: number | number[],
): Promise<any> {
	const channel = await getChannelConfig(instance, channelId)
	if (!channel.ChannelSource) {
		return
	}

	const profiles: Array<any> = channel.ChannelSource.ChannelProfile
	const eventIdList = Array.isArray(eventId) ? eventId : [eventId]

	const newProfiles = profiles.map((profile) => ({
		...profile,
		ProfileEvent: profile.ProfileEvent.filter((event: any) => !eventIdList.includes(event.id)),
	}))

	return await setChannelSetting(instance, channelId, 'ChannelProfile', newProfiles)
}
