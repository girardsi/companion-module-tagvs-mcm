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
