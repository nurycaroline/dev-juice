/**
 * Utility for generating valid Brazilian CPF numbers
 */

/**
 * Generates a valid CPF number.
 * @param formatted Whether to return the CPF formatted
 * @returns A string with a valid CPF
 */
export function generateCPF(formatted: boolean = true): string {
    // Generate random numbers for the first 9 digits
    const numbers: number[] = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10));
    
    // Calculate first verification digit
    const firstVerificationDigit = calculateVerificationDigit(numbers);
    numbers.push(firstVerificationDigit);
    
    // Calculate second verification digit (now including the first verification digit)
    const secondVerificationDigit = calculateVerificationDigit(numbers);
    numbers.push(secondVerificationDigit);
    
    // Convert to string
    const cpf = numbers.join('');
    
    // Format if requested
    return formatted ? formatCPF(cpf) : cpf;
}

/**
 * Calculates a verification digit based on the provided digits.
 * @param digits Array of digits to calculate the verification digit
 * @returns The calculated verification digit
 */
function calculateVerificationDigit(digits: number[]): number {
    // Calculate the sum of the multiplication of each digit by its weight
    // For the first digit, weights start from 10 (for 9 digits)
    // For the second digit, weights start from 11 (for 10 digits)
    const weight = digits.length + 1;
    
    const sum = digits.reduce((acc, digit, index) => {
        return acc + digit * (weight - index);
    }, 0);
    
    // Calculate the remainder of division by 11
    const remainder = (sum * 10) % 11;
    
    // If remainder is 10, the verification digit is 0
    return remainder === 10 ? 0 : remainder;
}

/**
 * Formats a CPF number with dots and dash.
 * @param cpf A string with 11 digits
 * @returns The formatted CPF string
 */
export function formatCPF(cpf: string): string {
    // Ensure CPF has 11 digits
    if (cpf.length !== 11) {
        throw new Error('CPF must have 11 digits');
    }
    
    // Format as XXX.XXX.XXX-XX
    return `${cpf.substring(0, 3)}.${cpf.substring(3, 6)}.${cpf.substring(6, 9)}-${cpf.substring(9)}`;
}

/**
 * Validates if a CPF number is valid.
 * @param cpf CPF number (with or without formatting)
 * @returns Whether the CPF is valid
 */
export function validateCPF(cpf: string): boolean {
    // Remove non-numeric characters
    const cleanCPF = cpf.replace(/[^\d]/g, '');
    
    // CPF must have 11 digits
    if (cleanCPF.length !== 11) {
        return false;
    }
    
    // Check if all digits are the same (which would be invalid)
    if (/^(\d)\1+$/.test(cleanCPF)) {
        return false;
    }
    
    // Get the first 9 digits
    const digits = cleanCPF.substring(0, 9).split('').map(Number);
    
    // Calculate first verification digit
    const firstVerificationDigit = calculateVerificationDigit(digits);
    digits.push(firstVerificationDigit);
    
    // Calculate second verification digit
    const secondVerificationDigit = calculateVerificationDigit(digits);
    
    // Check if the verification digits match
    return (
        firstVerificationDigit === Number(cleanCPF.charAt(9)) &&
        secondVerificationDigit === Number(cleanCPF.charAt(10))
    );
}
