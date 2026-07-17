import {
	acknowledgeChannelEvents,
	disableChannel,
	disableSnooze,
	enableChannel,
	enableSnooze,
	setChannelSetting,
} from './api.js'
import type ModuleInstance from './main.js'
import { syncData } from './sync.js'

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
	})
}
