/**
 * Generate unique class code
 * Format: 3 uppercase letters + 4 digits (e.g., MTH4821)
 */
function generateClassCode() {
    // Generate 3 random uppercase letters
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let code = '';

    for (let i = 0; i < 3; i++) {
        code += letters.charAt(Math.floor(Math.random() * letters.length));
    }

    // Generate 4 random digits
    for (let i = 0; i < 4; i++) {
        code += Math.floor(Math.random() * 10);
    }

    return code;
}

module.exports = { generateClassCode };
