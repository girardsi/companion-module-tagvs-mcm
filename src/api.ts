import { InstanceStatus } from '@companion-module/base'
import type ModuleInstance from './main.js'
import { fetchData } from './requests.js'

export async function CheckConnection(instance: ModuleInstance): Promise<void> {
	if (!instance.config.ip || !instance.config.port || !instance.config.username || !instance.secrets.password) {
		instance.updateStatus(InstanceStatus.BadConfig, 'Missing configuration: IP, port, username, or password')
		instance.log('error', ` Missing configuration: IP, port, username, or password`)
		return
	}

	try {
		await fetchData.call(instance, '/devices/meta.json', 'GET')
	} catch (err) {
		//if econnrefused, it is probably the wrong IP/Port or server is down
		instance.updateStatus(InstanceStatus.UnknownError, 'Connection failed - check configuration')
		instance.log('error', `Connection failed: ${err}`)
	}
}
