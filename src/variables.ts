import type ModuleInstance from './main.js'
import { hexToRgb, decodeCharCodes } from './util.js'

export type VariablesSchema = {
	device_name: string
	device_id: number
	device_ip_address: string
	device_color: string

	device_series: string
	device_model: string
	device_version: string
	device_hardware: string
	device_capability: string

	device_usage_point: number
	device_total_point: number

	device_total_licenses: number
	device_active_licenses: number
	device_licence_sharing: boolean

	device_active_input: number
	device_active_uncompressed_input: number
	device_active_output: number
}

export function UpdateVariableDefinitions(self: ModuleInstance): void {
	self.setVariableDefinitions({
		device_name: { name: 'Device: Name' },
		device_id: { name: 'Device: S/N' },
		device_color: { name: 'Device: Color' },
		device_ip_address: { name: 'Device: IP Address' },

		device_series: { name: 'Device: Product' },
		device_model: { name: 'Device: Model' },
		device_version: { name: 'Device: Version' },
		device_hardware: { name: 'Device: Hardware' },
		device_capability: { name: 'Device: Capability' },

		device_usage_point: { name: 'Device: Hardware points consumed' },
		device_total_point: { name: 'Device: Hardware points avaliable' },

		device_total_licenses: { name: 'Device: Licenses avaliable' },
		device_active_licenses: { name: 'Device: Licenses active' },
		device_licence_sharing: { name: 'Device: licenses sharing' },

		device_active_input: { name: 'Device: Active inputs' },
		device_active_uncompressed_input: { name: 'Device: Active inputs uncompressed' },
		device_active_output: { name: 'Device: Active outputs' },
	})

	if (!self.deviceConfig) {
		return
	}

	self.setVariableValues({
		device_name: JSON.stringify(self.deviceConfig.title)?.replace(/"/g, ''),
		device_id: Number(self.deviceConfig.id),
		device_color: hexToRgb(String(JSON.stringify(self.deviceConfig.color))?.replace(/"/g, '')),
		device_ip_address: JSON.stringify(self.deviceConfig.ip_address)?.replace(/"/g, ''),

		device_series: JSON.stringify(self.deviceConfig.series)?.replace(/"/g, ''),
		device_model: JSON.stringify(self.deviceConfig.model)?.replace(/"/g, ''),
		device_version: JSON.stringify(self.deviceConfig.version)?.replace(/"/g, ''),
		device_hardware: decodeCharCodes(JSON.stringify(self.deviceConfig.hardware_desc)?.replace(/"/g, '')),
		device_capability: JSON.stringify(self.deviceConfig.capability_desc)?.replace(/"/g, ''),

		device_usage_point: Number(self.deviceConfig.active_weight),
		device_total_point: Number(self.deviceConfig.total_weight),

		device_total_licenses: Number(self.deviceConfig.total_licenses),
		device_active_licenses: Number(self.deviceConfig.active_licenses),
		device_licence_sharing: Boolean(self.deviceConfig.license_sharing),

		device_active_input: Number(self.deviceConfig.active_decoders),
		device_active_uncompressed_input: Number(self.deviceConfig.active_uncompressed),
		device_active_output: Number(self.deviceConfig.active_encoders),
	})
}
