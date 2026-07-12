import { getChannelStatistics } from './api.js'
import type ModuleInstance from './main.js'

export type FeedbacksSchema = {
	get_channel_status: {
		type: 'value'
		options: {
			channel_id: number
			parameter: string
		}
	}

	get_device_status: {
		type: 'value'
		options: {
			parameter: string
		}
	}
}

export function UpdateFeedbacks(self: ModuleInstance): void {
	self.setFeedbackDefinitions({
		get_channel_status: {
			name: 'channel: Get status',
			type: 'value',
			options: [
				{
					id: 'channel_id',
					type: 'dropdown',
					label: 'Channel',
					default: '',
					choices: self.channelsDropdown,
				},
				{
					id: 'parameter',
					type: 'dropdown',
					label: 'Parameter',
					default: 'default_value',
					choices: [
						{ id: 'id', label: 'ID' },
						{ id: 'monitoring_level', label: 'Monitoring Level' },
						{ id: 'is_snoozed', label: 'Is Snoozed' },
						{ id: 'snooze_remark', label: 'Snooze Remark' },
						{ id: 'title', label: 'Title' },
						{ id: 'uuid', label: 'UUID' },
						{ id: 'network_id', label: 'Network ID' },
						{ id: 'iface', label: 'Interface' },
						{ id: 'total_bitrate', label: 'Total Bitrate' },
						{ id: 'null_padding_count', label: 'Null Padding Count' },
						{ id: 'cc_errors', label: 'CC Errors' },
						{ id: 'service_type_id', label: 'Service Type ID' },
						{ id: 'device_id', label: '	Device ID' },
						{ id: 'is_record_enabled', label: 'Is Record Enabled' },
						{ id: 'is_descrambling_enabled', label: 'Is Descrambling Enabled' },
						{ id: 'highest_active_event_serverity_id', label: 'Highest Active Event Severity ID' },
						{ id: 'source_address', label: 'Source Address' },
						{ id: 'secondary_source_address', label: 'Secondary Source Address' },
						{ id: 'source_transport_mode_id', label: 'Source Transport Mode ID' },
						{ id: 'modified', label: 'Modified' },
					],
				},
			],
			callback: async (feedback) => {
				if (!feedback.options.channel_id) {
					self.log('error', 'No channel selected for feedback')
					return
				}
				self.log(
					'debug',
					`Fetching status for channel ${feedback.options.channel_id} and parameter ${feedback.options.parameter}`,
				)
				const channelStatus = await getChannelStatistics(self, feedback.options.channel_id)

				if (!channelStatus) {
					return false
				}
				if (!(feedback.options.parameter in channelStatus.ChannelStatistics)) {
					throw new Error(`Invalid parameter key: ${feedback.options.parameter}`)
				}

				return channelStatus.ChannelStatistics[feedback.options.parameter]
			},
		},

		get_device_status: {
			name: 'Device: Get status',
			type: 'value',
			options: [
				{
					id: 'parameter',
					type: 'dropdown',
					label: 'Parameter',
					default: 'id',
					choices: [
						{ id: 'id', label: 'ID' },
						{ id: 'is_conected_device', label: 'Is Connected Device' },
						{ id: 'title', label: 'Title' },
						{ id: 'color', label: 'Color' },
						{ id: 'license_sharing', label: 'License Sharing' },
						{ id: 'sys_up_time', label: 'Sys Up Time' },
						{ id: 'sys_running_time', label: 'Sys Running Time' },
						{ id: 'current_time', label: 'Current Time' },
						{ id: 'stack_title', label: 'Stack Title' },
						{ id: 'status_stack_title', label: 'Status Stack Title' },
						{ id: 'series', label: 'Series' },
						{ id: 'model', label: 'Model' },
						{ id: 'serial', label: 'Serial' },
						{ id: 'version', label: 'Version' },
						{ id: 'hardware_desc', label: 'Hardware Desc' },
						{ id: 'capability_desc', label: 'Capability Desc' },
						{ id: 'working_mode_id', label: 'Working Mode ID' },
						{ id: 'total_licenses', label: 'Total Licenses' },
						{ id: 'active_licenses', label: 'Active Licenses' },
						{ id: 'licensed_features', label: 'Licensed Features' },
						{ id: 'license_expiration', label: 'License Expiration' },
						{ id: 'total_weight', label: 'Total Weight' },
						{ id: 'active_weight', label: 'Active Weight' },
						{ id: 'dynamic_weight', label: 'Dynamic Weight' },
						{ id: 'active_decoders', label: 'Active Decoders' },
						{ id: 'active_recorders', label: 'Active Recorders' },
						{ id: 'active_fingerprints', label: 'Active Fingerprints' },
						{ id: 'active_descramblers', label: 'Active Descramblers' },
						{ id: 'active_uncompressed', label: 'Active Uncompressed' },
						{ id: 'active_encoders', label: 'Active Encoders' },
						{ id: 'current_active_image', label: 'Current Active Image' },
						{ id: 'next_boot_image', label: 'Next Boot Image' },
						{ id: 'status_id', label: 'Status ID' },
						{ id: 'ntp_offset', label: 'NTP Offset' },
						{ id: 'ntp_offset_age', label: 'NTP Offset Age' },
						{ id: 'ntp_drift', label: 'NTP Drift' },
						{ id: 'ntp_sync', label: 'NTP Sync' },
						{ id: 'max_rec_time', label: 'Max Rec Time' },
						{ id: 'cur_rec_bandwidth', label: 'Cur Rec Bandwidth' },
						{ id: 'ip_address', label: 'IP Address' },
						{ id: 'modified', label: 'Modified' },
						{ id: 'statistics', label: 'Statistics' },
						{ id: 'Ldap', label: 'LDAP' },
					],
				},
			],
			callback: async (feedback) => {
				return self.deviceConfig[feedback.options.parameter]
			},
		},
	})
}
