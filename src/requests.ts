import { InstanceStatus } from '@companion-module/base'
import type ModuleInstance from './main.js'

export async function fetchData(
	instance: ModuleInstance,
	//verbose: boolean = true, // log request and errors, but only if instance.config.verbose - used to keep the polling quiet
	endpoint: string,
	method: string = 'GET',
): Promise<any> {
	const url = `http://${instance.config.ip}:${instance.config.port}/api/2.0${endpoint}`

	const headers: Record<string, string> = {
		accept: 'application/json',
		'content-type': 'application/json',
		authorization: `Basic ${Buffer.from(`${instance.config.username}:${instance.secrets.password}`).toString('base64')}`,
	}

	const request: RequestInit = {
		method,
		headers,
	}

	// fetch data
	const response = await fetch(url, request)

	// If unauthorized, try refresh once
	if (response.status === 400) {
		instance.log('debug', '400 Bad Request, Incorrect endpoint or request body')
		instance.updateStatus(InstanceStatus.ConnectionFailure, '400, Incorrect endpoint or request body')
		return false
	}

	if (response.status === 401) {
		instance.log('error', `${method} ${url} ${endpoint} failed: ${response.status} ${response.statusText}`.trim())
		instance.updateStatus(InstanceStatus.AuthenticationFailure, '401, Incorrect username/password')
		return false
	}

	if (response.status === 404) {
		instance.log('error', `${method} ${url} ${endpoint} failed: ${response.status} ${response.statusText}`.trim())
		return false
	}

	if (!response.ok) {
		const text = await response.text()
		instance.log(
			'error',
			`${method} ${url} ${endpoint} failed: ${response.status} ${response.statusText} ${text}`.trim(),
		)
		throw new Error(`${method} ${endpoint} failed: ${response.status}`)
	}

	instance.updateStatus(InstanceStatus.Ok, 'Connection successful')

	const json = await response.json()
	//if (instance.config.verbose) instance.log('debug', `Response: ${JSON.stringify(json)}`)
	return json
}

export async function putData(
	instance: ModuleInstance,
	//verbose: boolean = true, // log request and errors, but only if instance.config.verbose - used to keep the polling quiet
	endpoint: string,
	method: string = 'PUT',
	body: any = '',
): Promise<any> {
	const url = `http://${instance.config.ip}:${instance.config.port}/api/2.0${endpoint}`

	const headers: Record<string, string> = {
		accept: 'application/json',
		'content-type': 'application/json',
		authorization: `Basic ${Buffer.from(`${instance.config.username}:${instance.secrets.password}`).toString('base64')}`,
	}

	const request: RequestInit = {
		method,
		headers,
		body,
	}

	// fetch data
	const response = await fetch(url, request)

	// If unauthorized, try refresh once
	if (response.status === 400) {
		instance.log('debug', '400 Bad Request, Incorrect endpoint or request body')
		instance.updateStatus(InstanceStatus.ConnectionFailure, '400, Incorrect endpoint or request body')
		return false
	}

	if (response.status === 401) {
		instance.log('error', `${method} ${url} ${endpoint} failed: ${response.status} ${response.statusText}`.trim())
		instance.updateStatus(InstanceStatus.AuthenticationFailure, '401, Incorrect username/password')
		return false
	}

	if (response.status === 404) {
		instance.log('error', `${method} ${url} ${endpoint} failed: ${response.status} ${response.statusText}`.trim())
		return false
	}

	if (!response.ok) {
		const text = await response.text()
		instance.log(
			'error',
			`${method} ${url} ${endpoint} failed: ${response.status} ${response.statusText} ${text}`.trim(),
		)
		throw new Error(`${method} ${endpoint} failed: ${response.status}`)
	}

	instance.updateStatus(InstanceStatus.Ok, 'Connection successful')

	const json = await response.json()
	//if (instance.config.verbose) instance.log('debug', `Response: ${JSON.stringify(json)}`)
	return json
}
