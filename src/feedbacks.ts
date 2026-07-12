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
					// Process the channelStatus based on the selected parameter
					return false
				}

				switch (feedback.options.parameter) {
					case 'id':
						return channelStatus.ChannelStatistics.id

					case 'monitoring_level':
						return channelStatus.ChannelStatistics.monitoring_level

					case 'is_snoozed':
						return Boolean(channelStatus.ChannelStatistics.is_snoozed)

					case 'snooze_remark':
						return channelStatus.ChannelStatistics.snooze_remark

					case 'title':
						return channelStatus.ChannelStatistics.title

					case 'uuid':
						return channelStatus.ChannelStatistics.uuid

					case 'network_id':
						return channelStatus.ChannelStatistics.network_id

					case 'iface':
						return channelStatus.ChannelStatistics.iface

					case 'total_bitrate':
						return channelStatus.ChannelStatistics.total_bitrate

					case 'null_padding_count':
						return channelStatus.ChannelStatistics.null_padding_count

					case 'cc_errors':
						return channelStatus.ChannelStatistics.cc_errors

					case 'service_type_id':
						return channelStatus.ChannelStatistics.service_type_id

					case 'device_id':
						return channelStatus.ChannelStatistics.device_id

					case 'is_record_enabled':
						return Boolean(channelStatus.ChannelStatistics.is_record_enabled)

					case 'is_descrambling_enabled':
						return Boolean(channelStatus.ChannelStatistics.is_descrambling_enabled)

					case 'highest_active_event_serverity_id':
						return channelStatus.ChannelStatistics.highest_active_event_serverity_id

					case 'source_address':
						return channelStatus.ChannelStatistics.source_address

					case 'secondary_source_address':
						return channelStatus.ChannelStatistics.secondary_source_address

					case 'source_transport_mode_id':
						return channelStatus.ChannelStatistics.source_transport_mode_id

					case 'modified':
						return channelStatus.ChannelStatistics.modified

					default:
						self.log('error', `Unknown parameter: ${feedback.options.parameter}`)
						return false
				}
			},
		},
	})
}
