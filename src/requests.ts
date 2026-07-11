import { InstanceStatus } from '@companion-module/base'
import type ModuleInstance from './main.js'

export async function fetchData(
	this: ModuleInstance,
	//verbose: boolean = true, // log request and errors, but only if instance.config.verbose - used to keep the polling quiet
	endpoint: string,
	method: string = 'GET',
): Promise<any> {
	const url = `http://${this.config.ip}:${this.config.port}/api/2.0${endpoint}`

	const headers: Record<string, string> = {
		accept: 'application/json',
		'content-type': 'application/json',
		authorization: `Basic ${Buffer.from(`${this.config.username}:${this.secrets.password}`).toString('base64')}`,
	}

	const request: RequestInit = {
		method,
		headers,
	}

	// fetch data
	const response = await fetch(url, request)

	// If unauthorized, try refresh once
	if (response.status === 400) {
		this.log('debug', '400 Bad Request, Incorrect endpoint or request body')
		this.updateStatus(InstanceStatus.ConnectionFailure, '400, Incorrect endpoint or request body')
		return false
	}

	if (response.status === 401) {
		this.log('error', `${method} ${url} ${endpoint} failed: ${response.status} ${response.statusText}`.trim())
		this.updateStatus(InstanceStatus.AuthenticationFailure, '401, Incorrect username/password')
		return false
	}

	if (!response.ok) {
		const text = await response.text()
		this.log('error', `${method} ${url} ${endpoint} failed: ${response.status} ${response.statusText} ${text}`.trim())
		throw new Error(`${method} ${endpoint} failed: ${response.status}`)
	}

	this.updateStatus(InstanceStatus.Ok, 'Connection successful')

	const json = await response.json()
	//if (this.config.verbose) this.log('debug', `Response: ${JSON.stringify(json)}`)
	return json
}
