import { InstanceStatus } from '@companion-module/base'
import type ModuleInstance from './main.js'
import { fetchData, putData } from './requests.js'
import { daysToBinaryString, type Days } from './util.js'

/********************************************** 
					Device
***********************************************/
export async function CheckConnection(instance: ModuleInstance): Promise<boolean> {
	if (!instance.config.ip || !instance.config.port || !instance.config.username || !instance.secrets.password) {
		instance.updateStatus(InstanceStatus.BadConfig, 'Missing configuration: IP, port, username, or password')
		instance.log('error', ` Missing configuration: IP, port, username, or password`)
		return false
	}

	try {
		const status = await fetchData(instance, '/devices/meta.json', 'GET', true)
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

/********************************************** 
				Channel: Config
***********************************************/
export async function getAllChannels(instance: ModuleInstance): Promise<any> {
	return await fetchData(instance, '/channels/config.json', 'GET')
}

export async function getChannelConfig(instance: ModuleInstance, channelId: number): Promise<any> {
	const channel = await fetchData(instance, `/channels/config/${channelId}/.json`, 'GET')

	if (!channel.ChannelSource) {
		instance.log('error', `Cannot get the config of channel ID: '${channelId}'. Channel not found...`)
		return
	}
	return channel.ChannelSource
}

export async function setChannelSetting(
	instance: ModuleInstance,
	channelId: number,
	key: string, //Key of the setting
	value: string | any, // Value to set
): Promise<any> {
	const channel = await getChannelConfig(instance, channelId)
	if (!channel) {
		return
	}

	if (!(key in channel)) {
		// Handling incorrect key error
		instance.log(
			'error',
			`Cannot set ${key} to ${JSON.stringify(value)} on channel '${channelId}'. Key dosen't exist...`,
		)
		return
	}

	instance.log('info', `Set ${key} to ${value} on channel '${channel.title}'.`)

	// Set value on the array
	channel[key] = value
	return await putData(
		instance,
		`/channels/config/${channelId}/.json`,
		'PUT',
		JSON.stringify({ ChannelSource: channel }),
	)
}

/********************************************** 
				Channel: Commands
***********************************************/
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

export async function getChannelStatistics(instance: ModuleInstance, channelId: number): Promise<any> {
	instance.log('debug', `Fetching statistics for channel ${channelId}`)
	return await fetchData(instance, `/channels/statistics/${channelId}.json`, 'GET')
}

/********************************************** 
		Channel: Event Acknowledging
***********************************************/
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

/********************************************** 
				Channel: Profile 
***********************************************/
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

export async function getChannelProfilesStatistics(instance: ModuleInstance, channelId: number): Promise<any> {
	const channelStatistics = await getChannelStatistics(instance, channelId)
	if (!channelStatistics.ChannelStatistics.ChannelProfile) {
		return false
	}

	return channelStatistics.ChannelStatistics.ChannelProfile
}

export async function getChannelProfiles(instance: ModuleInstance, channelId: number): Promise<any> {
	const channelStatistics = await getChannelConfig(instance, channelId)
	if (!channelStatistics.ChannelProfile) {
		return false
	}

	return channelStatistics.ChannelProfile
}

export async function addChannelProfile(
	instance: ModuleInstance,
	channelId: number,
	profileName: string,
	notificationsSetId?: number,
	eventRuleSetId?: number,
	titleColorId?: number,
	borderColorId?: number,
): Promise<any> {
	const profiles = await getChannelProfiles(instance, channelId)
	const newProfile = {
		...profiles[0],
		id: '',
		is_default: 0,
		ProfileEvent: [],
		title: profileName,
		notification_set_id: notificationsSetId ?? Number(profiles[0].notification_set_id),
		event_rule_set_id: eventRuleSetId ?? profiles[0].event_rule_set_id,
		title_color_id: titleColorId ?? profiles[0].title_color_id,
		border_color_id: borderColorId ?? profiles[0].border_color_id,
	}

	const newProfileList = [...profiles, newProfile]
	return await setChannelSetting(instance, channelId, 'ChannelProfile', newProfileList)
}

export async function removeChannelProfile(
	instance: ModuleInstance,
	channelId: number,
	profileId: number,
): Promise<any> {
	const profiles = await getChannelProfiles(instance, channelId)
	const newProfiles = profiles.filter((profile: any) => profile.id !== profileId)

	return await setChannelSetting(instance, channelId, 'ChannelProfile', newProfiles)
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

/********************************************** 
			Channel: Event Schedule
***********************************************/

export async function getChannelEventScheduleId(
	instance: ModuleInstance,
	channelId: number,
	eventName: string,
): Promise<number | number[]> {
	const channel = await getChannelConfig(instance, channelId)
	if (!channel) {
		return -1
	}

	const profiles: Array<any> = channel.ChannelProfile

	return profiles.flatMap((profile) =>
		profile.ProfileEvent.filter((event: any) => event.title == eventName).map((event: any) => event.id),
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
	if (!channel) {
		return
	}

	const profiles: Array<any> = channel.ChannelProfile

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
	if (!channel) {
		return
	}

	const profiles: Array<any> = channel.ChannelProfile
	const eventIdList = Array.isArray(eventId) ? eventId : [eventId]

	const newProfiles = profiles.map((profile) => ({
		...profile,
		ProfileEvent: profile.ProfileEvent.filter((event: any) => !eventIdList.includes(event.id)),
	}))

	return await setChannelSetting(instance, channelId, 'ChannelProfile', newProfiles)
}
