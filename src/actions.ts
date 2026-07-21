import {
	acknowledgeChannelEvents,
	addChannelEventSchedule,
	disableChannel,
	disableSnooze,
	enableChannel,
	enableSnooze,
	forceChannelProfile,
	forceChannelProfileByName,
	releaseChannelProfile,
	setChannelSetting,
} from './api.js'
import type ModuleInstance from './main.js'
import { syncData } from './sync.js'
import { textToDurationMs, textToUnixTimeMs, type Days } from './util.js'

export type ActionsSchema = {
	sync_data: {
		options: {
			value: number
		}
	}

	set_channel_settings: {
		options: {
			channel_id: number[]
			setting: string
			value: string
		}
	}

	enable_channel: {
		options: {
			channel_id: number[]
		}
	}

	disable_channel: {
		options: {
			channel_id: number[]
		}
	}

	snooze_channel: {
		options: {
			channel_id: number[]
			note: string
		}
	}

	unsnooze_channel: {
		options: {
			channel_id: number[]
		}
	}

	channel_acknowledge_events: {
		options: {
			channel_id: number[]
		}
	}

	channel_force_profile: {
		options: {
			channel_id: number[]
			profile_id: number
		}
	}

	channel_force_profile_by_name: {
		options: {
			channel_id: number[]
			profile_name: string
		}
	}

	channel_release_profile: {
		options: {
			channel_id: number[]
		}
	}

	channel_schedule_event: {
		options: {
			channel_id: number[]
			profile_name: string
			event_name: string
			event_priority: number
			static_text_1: string
			event_start_time: string
			event_duration: string
			event_end_time: string
			event_days: Days[]
		}
	}
}

export function UpdateActions(self: ModuleInstance): void {
	self.setActionDefinitions({
		sync_data: {
			name: 'Syncronize device data',
			options: [
				{
					id: 'value',
					type: 'number',
					label: 'Test',
					default: 5,
					min: 0,
					max: 100,
				},
			],
			callback: async (_) => {
				await syncData(self)
			},
		},

		set_channel_settings: {
			name: 'Channel: Set settings',
			options: [
				{
					id: 'channel_id',
					type: 'multidropdown',
					label: 'Channel',
					default: [0],
					choices: self.channelsDropdown,
				},
				{
					id: 'setting',
					type: 'dropdown',
					label: 'Setting',
					default: '',
					choices: [
						{ id: 'access_type_id', label: 'Access Type ID' },
						{ id: 'title', label: 'Title' },
						{ id: 'uuid', label: 'UUID' },
						{ id: 'network_id', label: 'Network ID' },
						{ id: 'snooze_on_profile_change', label: 'Snooze On Profile Change' },
						{ id: 'channel_source_pid_behavior_id', label: 'Channel Source PID Behavior ID' },
						{ id: 'st2038_mode', label: 'ST-2038 Mode' },
						{ id: 'tls_mode', label: 'TLS Mode' },
						{ id: 'color_format_override_id', label: 'Color Format Override ID' },
						{ id: 'roi_mode_id', label: 'ROI Mode ID' },
						{ id: 'roi_config', label: 'ROI Config' },
						{ id: 'roi_visualize', label: 'ROI Visualize' },
						{ id: 'monitoring_level', label: 'Monitoring Level' },
						{ id: 'audio_standard_type_id', label: 'Audio Standard Type ID' },
						{ id: 'service_type_id', label: 'Service Type ID' },
						{ id: 'standard_type_id', label: 'Standard Type ID' },
						{ id: 'device_id', label: 'Device ID' },
						{ id: 'is_record_enabled', label: 'Is Record Enabled' },
						{ id: 'is_fingerprint_enabled', label: 'Is Fingerprint Enabled' },
						{ id: 'is_descrambling_enabled', label: 'Is Descrambling Enabled' },
						{ id: 't2mi_plp', label: 'T2-MI PLP' },
						{ id: 'encryption_type_id', label: 'Encryption Type ID' },
						{ id: 'encryption_constant_cw', label: 'Encryption Constant CW' },
						{ id: 'parent_id', label: 'Parent ID' },
						{ id: 'note', label: 'Note' },
						{ id: 'tally_settings', label: 'Tally Settings' },
						{ id: 'nielsen_reference', label: 'Nielsen Reference' },
						{ id: 'kantar_reference', label: 'Kantar Reference' },
						{ id: 'ssim_min', label: 'SSIM Min' },
						{ id: 'ssim_max', label: 'SSIM Max' },
						{ id: 'is_scheduling_enabled', label: 'Is Scheduling Enabled' },
						{ id: 'cut_margin', label: 'Cut Margin' },
					],
				},
				{
					id: 'value',
					type: 'textinput',
					label: 'Value',
					default: '',
				},
			],
			callback: async (event) => {
				if (!event.options.channel_id || event.options.channel_id.length === 0) {
					self.log('error', 'Cant change setting, No channel selected')
					return
				}
				if (!event.options.setting) {
					self.log('error', 'No setting selected')
					return
				}

				for (const channelId of event.options.channel_id) {
					await setChannelSetting(self, channelId, event.options.setting, event.options.value)
				}
				void syncData(self)
				//self.checkFeedbacks('get_channel_status')
			},
		},

		enable_channel: {
			name: 'Channel: Enable',
			sortName: 'Channel: Enable 1',
			options: [
				{
					id: 'channel_id',
					type: 'multidropdown',
					label: 'Channel',
					default: [],
					choices: self.channelsDropdown,
				},
			],
			callback: async (event) => {
				if (!event.options.channel_id || event.options.channel_id.length === 0) {
					self.log('error', 'No channel selected for enabling')
					return
				}

				for (const channelId of event.options.channel_id) {
					await enableChannel(self, channelId)

					self.checkFeedbacks('get_channel_status')
				}
			},
		},

		disable_channel: {
			name: 'Channel: Disable',
			sortName: 'Channel: Enable 2',
			options: [
				{
					id: 'channel_id',
					type: 'multidropdown',
					label: 'Channel',
					default: [],
					choices: self.channelsDropdown,
				},
			],
			callback: async (event) => {
				if (!event.options.channel_id || event.options.channel_id.length === 0) {
					self.log('error', 'No channel selected for disabling')
					return
				}

				for (const channelId of event.options.channel_id) {
					await disableChannel(self, channelId)

					self.checkFeedbacks('get_channel_status')
				}
			},
		},

		snooze_channel: {
			name: 'Channel: Snooze',
			sortName: 'Channel: Snooze 1',
			options: [
				{
					id: 'channel_id',
					type: 'multidropdown',
					label: 'Channel',
					default: [],
					choices: self.channelsDropdown,
				},
				{
					id: 'note',
					type: 'textinput',
					label: 'Reason for snoozing',
					default: '',
				},
			],
			callback: async (event) => {
				if (!event.options.channel_id || event.options.channel_id.length === 0) {
					self.log('error', 'No channel selected for snoozing')
					return
				}

				if (!event.options.note || event.options.note.trim() === '') {
					event.options.note = 'Snoozed by Companion'
				}

				for (const channelId of event.options.channel_id) {
					await enableSnooze(self, channelId, event.options.note)

					self.checkFeedbacks('get_channel_status')
				}
			},
		},

		unsnooze_channel: {
			name: 'Channel: Unsnooze',
			sortName: 'Channel: Snooze 2',
			options: [
				{
					id: 'channel_id',
					type: 'multidropdown',
					label: 'Channel',
					default: [],
					choices: self.channelsDropdown,
				},
			],
			callback: async (event) => {
				if (!event.options.channel_id || event.options.channel_id.length === 0) {
					self.log('error', 'No channel selected for unsnoozing')
					return
				}

				for (const channelId of event.options.channel_id) {
					await disableSnooze(self, channelId)

					self.checkFeedbacks('get_channel_status')
				}
			},
		},

		channel_acknowledge_events: {
			name: 'Channel: Acknowledge events',
			sortName: 'Channel: Aknowledge events',
			options: [
				{
					id: 'channel_id',
					type: 'multidropdown',
					label: 'Channel',
					default: [],
					choices: self.channelsDropdown,
				},
			],
			callback: async (event) => {
				if (!event.options.channel_id || event.options.channel_id.length === 0) {
					self.log('error', 'No channel to acknowledge')
					return
				}

				for (const channelId of event.options.channel_id) {
					await acknowledgeChannelEvents(self, channelId)
				}

				self.checkFeedbacks('get_channel_status')
			},
		},

		channel_force_profile: {
			name: 'Channel: Force profile by ID',
			sortName: 'Channel: Force profile 1',
			options: [
				{
					id: 'channel_id',
					type: 'multidropdown',
					label: 'Channel',
					default: [],
					choices: self.channelsDropdown,
				},
				{
					id: 'profile_id',
					type: 'number',
					label: 'Profile ID',
					default: 1,
					min: 1,
					max: 99999,
				},
			],
			callback: async (event) => {
				if (!event.options.channel_id || event.options.channel_id.length === 0) {
					self.log('error', 'No channel selected...')
					return
				}

				if (!event.options.profile_id) {
					self.log('error', 'No profile id entered... please enter a profile id')
					return
				}

				for (const channelId of event.options.channel_id) {
					await forceChannelProfile(self, channelId, event.options.profile_id)
				}

				self.checkFeedbacks('get_channel_status')
			},
		},

		channel_force_profile_by_name: {
			name: 'Channel: Force profile by name',
			sortName: 'Channel: Force profile 2',
			options: [
				{
					id: 'channel_id',
					type: 'multidropdown',
					label: 'Channel',
					default: [],
					choices: self.channelsDropdown,
				},
				{
					id: 'profile_name',
					type: 'textinput',
					label: 'Profile',
					default: '',
				},
			],
			callback: async (event) => {
				if (!event.options.channel_id || event.options.channel_id.length === 0) {
					self.log('error', 'No channel to acknowledge')
					return
				}

				if (!event.options.profile_name) {
					self.log('error', 'No profile id entered... please enter a profile id')
					return
				}

				for (const channelId of event.options.channel_id) {
					await forceChannelProfileByName(self, channelId, event.options.profile_name)
				}

				self.checkFeedbacks('get_channel_status')
			},
		},

		channel_release_profile: {
			name: 'Channel: Release forced profile',
			sortName: 'Channel: Force profile 3',
			options: [
				{
					id: 'channel_id',
					type: 'multidropdown',
					label: 'Channel',
					default: [],
					choices: self.channelsDropdown,
				},
			],
			callback: async (event) => {
				if (!event.options.channel_id || event.options.channel_id.length === 0) {
					self.log('error', 'No channel selected.')
					return
				}

				for (const channelId of event.options.channel_id) {
					await releaseChannelProfile(self, channelId)
				}

				self.checkFeedbacks('get_channel_status')
			},
		},

		channel_schedule_event: {
			name: 'Channel: Schedule event',
			sortName: 'Channel: Schedule event',
			options: [
				{
					id: 'channel_id',
					type: 'multidropdown',
					label: 'Channel',
					default: [],
					choices: self.channelsDropdown,
				},
				{
					id: 'event_name',
					type: 'textinput',
					label: 'Event name',
					default: '',
				},
				{
					id: 'profile_name',
					type: 'textinput',
					label: 'Profile name',
					default: '',
				},
				{
					id: 'event_priority',
					type: 'number',
					label: 'Event Priority',
					default: 98,
					min: 1,
					max: 99,
				},
				{
					id: 'static_text_1',
					type: 'static-text',
					label: 'Time format',
					value:
						"Use natural declarative language to declare your time and duration for your event. (Ex: 'In 1 day and 1 hour', 'In 5 minutes', Duration: '1 hour and 5 minutes'.)",
				},
				{
					id: 'event_start_time',
					type: 'textinput',
					label: 'Event start time',
					default: 'In 1 hour',
				},
				{
					id: 'event_duration',
					type: 'textinput',
					label: 'Event duration',
					default: '1 hour',
				},
				{
					id: 'event_end_time',
					type: 'textinput',
					label: 'Repeat event until',
					default: 'In 12 hours',
				},
				{
					id: 'event_days',
					type: 'multidropdown',
					label: 'Schedule event on days',
					default: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
					choices: [
						{ id: 'sunday', label: 'Sunday' },
						{ id: 'monday', label: 'Monday' },
						{ id: 'tuesday', label: 'Tuesday' },
						{ id: 'wednesday', label: 'Wednesday' },
						{ id: 'thursday', label: 'Thursday' },
						{ id: 'friday', label: 'Friday' },
						{ id: 'saturday', label: 'Saturday' },
					],
				},
			],
			callback: async (event) => {
				if (!event.options.channel_id || event.options.channel_id.length === 0) {
					self.log('error', 'No channel selected.')
					return
				}

				for (const channelId of event.options.channel_id) {
					await addChannelEventSchedule(
						self,
						channelId,
						Number(event.options.profile_name),
						event.options.event_name,
						event.options.event_priority,
						textToUnixTimeMs(event.options.event_start_time) || 0,
						textToDurationMs(event.options.event_duration) || 0,
						textToUnixTimeMs(event.options.event_end_time) || 0,
						event.options.event_days,
					)
				}

				self.checkFeedbacks('get_channel_status')
			},
		},
	})
}
