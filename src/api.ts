import { InstanceStatus } from '@companion-module/base'
import type ModuleInstance from './main.js'
import { fetchData, putData } from './requests.js'
import { daysToBinaryString, type Days } from './util.js'
import type { ChannelProfile, ChannelSource, ProfileEvent } from './types.js'

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

export async function getChannelConfig(instance: ModuleInstance, channelId: ChannelSource['id']): Promise<any> {
	const channel = await fetchData(instance, `/channels/config/${channelId}/.json`, 'GET')

	if (!channel.ChannelSource) {
		instance.log('error', `Cannot get the config of channel ID: '${channelId}'. Channel not found...`)
		return
	}
	return channel.ChannelSource
}

export async function getChannelName(instance: ModuleInstance, channelId: ChannelSource['id']): Promise<string> {
	const channel = await fetchData(instance, `/channels/config/${channelId}/.json`, 'GET')

	if (!channel.ChannelSource) {
		instance.log('error', `Cannot get the config of channel ID: '${channelId}'. Channel not found...`)
		return ''
	}
	return channel.ChannelSource.title as string // for some reason, i need to do that
}

export async function isChannelExist(instance: ModuleInstance, channelId: ChannelSource['id']): Promise<boolean> {
	if (instance.channels.some((channel) => channel.id == channelId)) {
		return true
	}

	// If the channel is not found in the local channel list, ask directly the API
	if (getChannelConfig(instance, channelId) != null) {
		return true
	}

	return false
}

export async function setChannelSetting(
	instance: ModuleInstance,
	channelId: ChannelSource['id'],
	key: string, // Key of the setting
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
export async function enableChannel(instance: ModuleInstance, channelId: ChannelSource['id']): Promise<any> {
	if (!isChannelExist) {
		instance.log('error', `Can't enable channel '${channelId}'. Channel not found`)
		return
	}

	instance.log('debug', `Enabling channel '${await getChannelName(instance, channelId)}' (${channelId})`)
	return await fetchData(instance, `/channels/command/monitor/${channelId}//.json`, 'GET')
}

export async function disableChannel(instance: ModuleInstance, channelId: ChannelSource['id']): Promise<any> {
	if (!isChannelExist) {
		instance.log('error', `Can't disable channel '${channelId}'. Channel not found`)
		return
	}

	instance.log('debug', `disabling channel '${await getChannelName(instance, channelId)}' (${channelId})`)
	return await fetchData(instance, `/channels/command/unMonitor/${channelId}/.json`, 'GET')
}

export async function enableSnooze(
	instance: ModuleInstance,
	channelId: ChannelSource['id'],
	note: string,
): Promise<any> {
	if (!isChannelExist) {
		instance.log('error', `Can't enable snooze on channel '${channelId}'. Channel not found`)
		return
	}

	const url_note = encodeURIComponent(note) // Encode the snooze reason to be safe in an url

	instance.log(
		'debug',
		`Enabling snooze on channel '${await getChannelName(instance, channelId)}' (${channelId}). Reason: ${note}`,
	)
	return await fetchData(instance, `/channels/command/setSnooze/${channelId}/${url_note}/.json`, 'GET')
}

export async function disableSnooze(instance: ModuleInstance, channelId: ChannelSource['id']): Promise<any> {
	if (!isChannelExist) {
		instance.log('error', `Can't enable snooze on channel '${channelId}'. Channel not found`)
		return
	}

	instance.log('debug', `Disabling snooze on channel '${await getChannelName(instance, channelId)}' (${channelId})`)
	return await fetchData(instance, `/channels/command/clearSnooze/${channelId}/.json`, 'GET')
}

export async function getChannelStatistics(instance: ModuleInstance, channelId: ChannelSource['id']): Promise<any> {
	if (!isChannelExist) {
		instance.log('error', `Can't get statistics for channel '${channelId}'. Channel not found`)
		return
	}

	return await fetchData(instance, `/channels/statistics/${channelId}.json`, 'GET')
}

/********************************************** 
		Channel: Event Acknowledging
***********************************************/
export async function acknowledgeChannelEvents(instance: ModuleInstance, channelId: ChannelSource['id']): Promise<any> {
	instance.log('debug', `Acknowledge all events on channel ${channelId}`)
	const channelEvents = await getChannelEvents(instance, channelId)

	if (!channelEvents) {
		instance.log(
			'debug',
			`No events to acknowledge on channel '${await getChannelName(instance, channelId)}' (${channelId})`,
		)
		return
	}

	for (const event of channelEvents) {
		await fetchData(instance, `/channels/command/acknowledge/${channelId}/${event.id}.json`, 'GET')
	}
}

/* // The call don't seems to work...
export async function acknowledgeChannelEvents(instance: ModuleInstance, channelId: ChannelSource['id']): Promise<any> {
	instance.log('debug', `Acknowledge all events on channel ${channelId}`)
	return await fetchData(instance, `/channels/command/acknowledge/${channelId}.json`, 'POST')
} */

export async function getAllEvents(instance: ModuleInstance): Promise<any> {
	return await fetchData(instance, `/channels/events.json`, 'GET')
}

export async function getChannelEvents(instance: ModuleInstance, channelId: ChannelSource['id']): Promise<any> {
	if (!isChannelExist) {
		instance.log('error', `Can't get events of channel '${channelId}'. Channel not found`)
		return
	}

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

/********************************************** 
				Channel: Profile 
***********************************************/
export async function getChannelProfileId(
	instance: ModuleInstance,
	channelId: ChannelSource['id'],
	profileName: string,
): Promise<number> {
	if (!isChannelExist) {
		instance.log('error', `Can't get profile ID of '${profileName}' in channel '${channelId}'. Channel not found`)
		return -1
	}

	const channelProfiles = await getChannelProfiles(instance, channelId)
	if (!channelProfiles) {
		instance.log('error', `Can't get profile ID of '${profileName}' in channel '${channelId}'. Profiles not found`)
		return -1
	}

	const profileId = channelProfiles.find((profile) => String(profile.title).includes(profileName))?.id ?? -1
	return profileId
}

export async function getChannelProfilesStatistics(
	instance: ModuleInstance,
	channelId: ChannelSource['id'],
): Promise<any> {
	if (!isChannelExist) {
		instance.log('error', `Can't get profile statistics of channel '${channelId}'. Channel not found`)
		return
	}

	const channelStatistics = await getChannelStatistics(instance, channelId)
	if (!channelStatistics.ChannelStatistics.ChannelProfile) {
		return
	}

	return channelStatistics.ChannelStatistics.ChannelProfile
}

export async function getChannelProfiles(
	instance: ModuleInstance,
	channelId: ChannelSource['id'],
): Promise<ChannelProfile[]> {
	if (!isChannelExist) {
		instance.log('error', `Can't get profiles of channel '${channelId}'. Channel not found`)
		return []
	}

	const channelStatistics = await getChannelConfig(instance, channelId)
	if (!channelStatistics.ChannelProfile) {
		return []
	}

	return channelStatistics.ChannelProfile
}

export async function createChannelProfile(
	instance: ModuleInstance,
	channelId: ChannelSource['id'],
	profileName: string,
	notificationsSetId?: number,
	eventRuleSetId?: number,
	titleColorId?: number,
	borderColorId?: number,
): Promise<any> {
	if (!isChannelExist) {
		instance.log('error', `Can't create profile '${profileName}' for channel '${channelId}'. Channel not found`)
		return []
	}

	const profiles = await getChannelProfiles(instance, channelId)
	if (!profiles) {
		return
	}

	const newProfile: ChannelProfile = {
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

	const newProfileList: ChannelProfile[] = [...profiles, newProfile]
	return await setChannelSetting(instance, channelId, 'ChannelProfile', newProfileList)
}

export async function removeChannelProfile(
	instance: ModuleInstance,
	channelId: ChannelSource['id'],
	profileId: ChannelProfile['id'],
): Promise<any> {
	const profiles = await getChannelProfiles(instance, channelId)

	if (!profiles.some((profile) => profile.id == profileId)) {
		//Handling id issues
		instance.log(
			'error',
			`Can't remove profile with id '${profileId}. Profile not found in channel with ID '${channelId}'...`,
		)
		return
	}
	// create a new array without the profile with the specifed profileId
	const newProfiles = profiles.filter((profile) => profile.id !== profileId)

	// Apply the setting
	return await setChannelSetting(instance, channelId, 'ChannelProfile', newProfiles)
}

export async function forceChannelProfile(
	instance: ModuleInstance,
	channelId: ChannelSource['id'],
	profileId: ChannelProfile['id'],
): Promise<any> {
	const profiles = await getChannelProfiles(instance, channelId)
	if (!profiles.some((profile) => profile.id == profileId)) {
		// Handling id issues
		instance.log(
			'error',
			`Can't force profile with id '${profileId}. Profile not found in channel with ID '${channelId}'...`,
		)
		return
	}

	instance.log(
		'info',
		`Force profile with ID '${profileId}' on channel '${await getChannelName(instance, channelId)}' (ID: ${channelId})`,
	)
	return await fetchData(instance, `/channels/command/forceProfile/${channelId}/${profileId}/.json`, 'GET')
}

export async function releaseChannelProfile(instance: ModuleInstance, channelId: ChannelSource['id']): Promise<any> {
	instance.log(
		'info',
		`Release forced profile on channel '${await etChannelName(instance, channelId)}' (ID: ${channelId})`,
	)
	return await fetchData(instance, `/channels/command/forceProfile/${channelId}/0/.json`, 'GET')
}

/********************************************** 
			Channel: Event Schedule
***********************************************/

export async function getChannelEventScheduleId(
	instance: ModuleInstance,
	channelId: ChannelSource['id'],
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
	channelId: ChannelSource['id'],
	profileId: ChannelProfile['id'],
	eventName: ProfileEvent['title'],
	eventPriority: ProfileEvent['priority'],
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

		const event: ProfileEvent = {
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
	channelId: ChannelSource['id'],
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
