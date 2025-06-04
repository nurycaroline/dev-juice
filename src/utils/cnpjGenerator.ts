/**
 * Utility for generating valid Brazilian CNPJ numbers
 */

/**
 * Generates a valid CNPJ number.
 * @param formatted Whether to return the CNPJ formatted
 * @returns A string with a valid CNPJ
 */
export function generateCNPJ(formatted: boolean = true): string {
    // Generate random numbers for the first 12 digits
    const numbers: number[] = Array.from({ length: 12 }, () => Math.floor(Math.random() * 10));
    
    // Calculate first verification digit
    const firstVerificationDigit = calculateVerificationDigit(numbers);
    numbers.push(firstVerificationDigit);
    
    // Calculate second verification digit
    const secondVerificationDigit = calculateVerificationDigit(numbers);
    numbers.push(secondVerificationDigit);
    
    // Convert to string
    const cnpj = numbers.join('');
    
    // Format if requested
    return formatted ? formatCNPJ(cnpj) : cnpj;
}

/**
 * Calculates a verification digit based on the provided digits.
 * @param digits Array of digits to calculate the verification digit
 * @returns The calculated verification digit
 */
function calculateVerificationDigit(digits: number[]): number {
    // Multiplication weights for CNPJ calculation
    const weights = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    
    // If we're calculating the second digit, we need different weights
    if (digits.length === 13) {
        weights.unshift(6);
    }
    
    // Calculate the sum of the multiplication of each digit by its weight
    const sum = digits.reduce((acc, digit, index) => {
        return acc + digit * weights[index % weights.length];
    }, 0);
    
    // Calculate the remainder of division by 11
    const remainder = sum % 11;
    
    // If remainder is less than 2, the verification digit is 0
    // Otherwise, it's 11 minus the remainder
    return remainder < 2 ? 0 : 11 - remainder;
}

/**
 * Formats a CNPJ string to the standard XX.XXX.XXX/XXXX-XX format.
 * @param cnpj Unformatted CNPJ string
 * @returns Formatted CNPJ string
 */
export function formatCNPJ(cnpj: string): string {
    return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}

/**
 * Validates if a CNPJ string is valid.
 * @param cnpj CNPJ string to validate (can be formatted or not)
 * @returns True if the CNPJ is valid, false otherwise
 */
export function validateCNPJ(cnpj: string): boolean {
    // Remove non-numeric characters
    const cleanCnpj = cnpj.replace(/[^\d]/g, '');
    
    // Check if it has 14 digits
    if (cleanCnpj.length !== 14) {
        return false;
    }
    
    // Check if all digits are the same
    if (/^(\d)\1+$/.test(cleanCnpj)) {
        return false;
    }
    
    // Extract the first 12 digits and both verification digits
    const digits = cleanCnpj.split('').map(Number);
    const firstDigits = digits.slice(0, 12);
    
    // Calculate and check the first verification digit
    const calculatedFirstDigit = calculateVerificationDigit(firstDigits);
    if (calculatedFirstDigit !== digits[12]) {
        return false;
    }
    
    // Calculate and check the second verification digit
    const calculatedSecondDigit = calculateVerificationDigit(digits.slice(0, 13));
    return calculatedSecondDigit === digits[13];
}