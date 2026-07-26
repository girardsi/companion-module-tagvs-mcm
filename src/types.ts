/****************************************************
                    Channel types
****************************************************/

// Under ChannelSource
export interface ProfileEvent {
	id: number
	priority: number
	start_utc: string
	duration_millisecond: number
	days_of_week: number
	valid_until_utc: string
	title: string
}

// Under ChannelSource / ChannelProfile / ProfilePid
export interface PidAttribute {
	id: number
	pid_attribute_type_id: number
	pid_attribute_type_value: number
}

// Under ChannelSource / ChannelProfile
export interface ProfilePid {
	id: number
	pid: number
	pid_content_type_id: number
	is_enabled?: 0 | 1
	is_monitored?: 0 | 1
	is_content_monitored?: 0 | 1
	is_outofband?: 0 | 1
	bitrate_min?: number
	bitrate_max?: number
	is_scrambled: 0 | 1
	is_pcr: 0 | 1
	desc_hash: string | null
	PidAttribute?: PidAttribute[] // Not avaliable when listing all channels
}

// Under ChannelSource
export interface ChannelProfile {
	id: number
	title: string
	notification_set_id: number
	event_rule_set_id: number
	title_color_id?: number
	border_color_id?: number
	is_default: 0 | 1
	rst_running_state_id?: number
	is_scanned: 0 | 1
	is_scrambled: 0 | 1

	// Not avaliable when listing all channels
	pixelate_level?: number
	service_bitrate_min?: number
	service_bitrate_max?: number
	ProfileEvent?: ProfileEvent[]
	ProfilePid?: ProfilePid[]
}

// Main type for Channel
export interface ChannelSource {
	id: number
	access_type_id: number
	title: string
	uuid?: string
	network_id?: number
	snooze_on_profile_change?: number
	channel_source_pid_behavior_id?: number
	monitoring_level?: number
	audio_standard_type_id?: number
	service_type_id?: number
	standard_type_id?: number
	is_monitored?: 0 | 1
	device_id?: number
	is_record_enabled?: 0 | 1
	is_fingerprint_enabled?: 0 | 1
	is_scanned?: 0 | 1
	is_descrambling_enabled?: 0 | 1
	t2mi_plp?: number
	encryption_type_id?: number
	parent_id?: number | null
	note?: string
	tally_settings?: string
	modified?: string
	created?: string

	ChannelProfile: ChannelProfile[]

	// MPEG-TS specifics
	ip_address?: string
	ssm_ip_address?: string | null
	port?: number | null
	program_number?: number | null
	ts_id?: number | null
	ts_services?: number | null
	secondary_ip_address?: string | null
	secondary_ssm_ip_address?: string | null
	secondary_port?: number | null
	secondary_network_id?: number

	// OTT Specifics
	main_url?: string
	bandwidth?: number | null
	program_id?: number | null
	codec?: string | null
	audio?: string | null
	resolution?: string | null
	stream_url?: string | null
	asset_id?: string | null
	is_scrambled?: 0 | 1
	low_latency?: 0 | 1
	session_ttl?: number | null

	// CDI specifics
	second_url?: string

	// RTMP, WebRTC Specifics
	delay?: number
}

/*
export interface ChannelSourceRequest {
  ChannelSource: Partial<ChannelSource>;
}
  */
