/**
 * Utility for generating UUID (Universally Unique Identifier)
 */

/**
 * Generates a random UUID (v4).
 * @param formatted Whether to include hyphens in the UUID
 * @returns A string with a UUID
 */
export function generateUUID(formatted: boolean = true): string {
    // Implementation follows RFC4122 version 4
    const hexDigits = '0123456789abcdef';
    let uuid = '';
    
    for (let i = 0; i < 36; i++) {
        if (i === 8 || i === 13 || i === 18 || i === 23) {
            // Add hyphens at specific positions if formatted
            uuid += formatted ? '-' : '';
        } else if (i === 14) {
            // Version 4 UUIDs have the 14th digit set to '4'
            uuid += '4';
        } else if (i === 19) {
            // The 19th digit is either 8, 9, a, or b
            uuid += hexDigits.charAt(Math.floor(Math.random() * 4) + 8);
        } else {
            // Random hex digit
            uuid += hexDigits.charAt(Math.floor(Math.random() * 16));
        }
    }
    
    return uuid;
}

/**
 * Validates if a string is a valid UUID.
 * @param uuid The string to validate
 * @returns Whether the string is a valid UUID
 */
export function validateUUID(uuid: string): boolean {
    // Simple regex validation for UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
}
