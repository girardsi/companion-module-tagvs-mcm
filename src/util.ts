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

export function hexToRgb(hex: string): number {
	const r = parseInt(hex.slice(1, 3), 16)
	const g = parseInt(hex.slice(3, 5), 16)
	const b = parseInt(hex.slice(5, 7), 16)

	return Number(`${r}${g}${b}`)
}
