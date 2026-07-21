import * as chrono from 'chrono-node'

export function decodeCharCodes(text: string): string {
	/* Decode HTML character codes (both decimal and hexadecimal) to their corresponding characters */

	if (!text) return text

	return (
		text
			// Gère les codes décimaux (ex: &#60; -> <)
			.replace(/&#(\d+);/g, (_, dec) => {
				return String.fromCharCode(parseInt(dec, 10))
			})
			// Gère les codes hexadécimaux (ex: &#x3C; -> <)
			.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => {
				return String.fromCharCode(parseInt(hex, 16))
			})
	)
}

export function hexToRgb(hex: string): string {
	const r = parseInt(hex.slice(1, 3), 16).toString().padStart(3, '0')
	const g = parseInt(hex.slice(3, 5), 16).toString().padStart(3, '0')
	const b = parseInt(hex.slice(5, 7), 16).toString().padStart(3, '0')
	return String(`${r}${g}${b}`)
}

export function textToUnixTimeMs(userInput: string): number | null {
	const parsedDate = chrono.parseDate(userInput)

	if (!parsedDate) {
		return null
	}

	const unixTimestamp = Math.round(parsedDate.getTime() / 60000) * 60000 // MCM seems to want that kind of time.

	return unixTimestamp
}

export function textToDurationMs(text: string): number | null {
	const reference = new Date(0) // set Reference to 0 instead of 1 jan 1970

	const duration = chrono.parseDate(`In ${text}`, reference)

	if (!duration) {
		return null
	}

	return duration.getTime()
}

export type Days = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'
export function daysToBinaryString(daysToParse: Days[]): string {
	/******************************************************
    Return a parsed string containg 1 if the day is here 
	and 0 if the day is not here. 
	
	All in order of the days from sunday to saturday.
	Needed for MCM Event scheduling 
	******************************************************/

	const allDays: Days[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

	return allDays.map((day) => (daysToParse.includes(day) ? '1' : '0')).join('')
}
