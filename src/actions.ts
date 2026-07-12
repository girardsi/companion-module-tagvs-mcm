import { disableSnooze, enableSnooze } from './api.js'
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
						{ id: 'profile_is', label: 'Profile' },
						{ id: 'brightness', label: 'Brightness' },
					],
				},
			],
			callback: async (event) => {
				console.log('Hello world!', event.options.channel_id)
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
	})
}
