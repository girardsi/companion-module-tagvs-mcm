import { InstanceStatus } from '@companion-module/base'
import type ModuleInstance from './main.js'
import { fetchData } from './requests.js'

export async function CheckConnection(this: ModuleInstance): Promise<void> {
	if (!this.config.ip || !this.config.port || !this.config.username || !this.secrets.password) {
		this.updateStatus(InstanceStatus.BadConfig, 'Missing configuration: IP, port, username, or password')
		this.log('error', ` Missing configuration: IP, port, username, or password`)
		return
	}

	try {
		await fetchData.call(this, '/devices/meta.json', 'GET')
	} catch (err) {
		//if econnrefused, it is probably the wrong IP/Port or server is down
		this.updateStatus(InstanceStatus.UnknownError, 'Connection failed - check configuration')
		this.log('error', `Connection failed: ${err}`)
	}
}
