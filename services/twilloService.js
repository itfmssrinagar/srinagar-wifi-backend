import twilio from 'twilio';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Twilio client lazily after env vars are loaded
let twilioClient = null;

const getTwilioClient = () => {
    if (!twilioClient) {
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;

        if (!accountSid || !authToken) {
            throw new Error('Twilio credentials are missing. Please check TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in .env file.');
        }

        twilioClient = twilio(accountSid, authToken);
    }
    return twilioClient;
};

// In-memory OTP storage (use DB like Redis in production)
const otpStorage = new Map();

/**
 * Generate a 6-digit OTP
 * @returns {string} 6-digit OTP
 */
export const generateOtp = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Send 6-digit OTP via WhatsApp
 * @param {string} mobileNumber - Mobile number in international format (e.g., +919876543210)
 * @returns {Promise<Object>} Twilio response object
 */
export const sendOtp = async (mobileNumber) => {
    try {
        const otp = generateOtp();
        const expiryMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES) || 10;
        const expiryTime = Date.now() + expiryMinutes * 60 * 1000;

        // Format numbers for WhatsApp
        const whatsappFrom = process.env.TWILIO_WHATSAPP_NUMBER
            ? `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`
            : `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`;
        const whatsappTo = `whatsapp:${mobileNumber}`;

        const message = `Your Srinagar Airport WiFi OTP is: *${otp}*. This OTP is valid for ${expiryMinutes} minutes.`;

        // Get Twilio client (with validation)
        const client = getTwilioClient();

        // Validate WhatsApp number configuration
        if (!whatsappFrom || whatsappFrom === 'whatsapp:undefined') {
            throw new Error('Twilio WhatsApp number is not configured. Please set TWILIO_WHATSAPP_NUMBER or TWILIO_PHONE_NUMBER in .env file.');
        }

        const response = await client.messages.create({
            body: message,
            from: whatsappFrom,
            to: whatsappTo
        });

        otpStorage.set(mobileNumber, {
            otp: otp,
            expiresAt: expiryTime,
            attempts: 0
        });

        setTimeout(() => {
            otpStorage.delete(mobileNumber);
        }, expiryMinutes * 60 * 1000);

        return {
            success: true,
            messageSid: response.sid,
            status: response.status,
            otp: otp, // Remove this in production for security
            message: "OTP sent successfully via WhatsApp"
        };
    } catch (error) {
        console.error('Error sending OTP:', error);
        return {
            success: false,
            error: error.message,
            message: "Failed to send OTP"
        };
    }
};

/**
 * Verify 6-digit OTP
 * @param {string} mobileNumber - Mobile number in international format (e.g., +919876543210)
 * @param {string} otp - OTP entered by user
 * @returns {Object} Verification result
 */
export const verifyOtp = (mobileNumber, otp) => {
    try {
        const stored = otpStorage.get(mobileNumber);

        if (!stored) {
            return {
                success: false,
                message: 'OTP not found or expired. Please request a new OTP.'
            };
        }

        if (Date.now() > stored.expiresAt) {
            otpStorage.delete(mobileNumber);
            return {
                success: false,
                message: 'OTP has expired. Please request a new OTP.'
            };
        }

        const maxAttempts = parseInt(process.env.OTP_MAX_ATTEMPTS) || 3;
        if (stored.attempts >= maxAttempts) {
            otpStorage.delete(mobileNumber);
            return {
                success: false,
                message: 'Maximum verification attempts exceeded. Please request a new OTP.'
            };
        }

        stored.attempts++;

        if (stored.otp === otp) {
            otpStorage.delete(mobileNumber);
            return {
                success: true,
                message: 'OTP verified successfully'
            };
        } else {
            otpStorage.set(mobileNumber, stored);
            const remaining = maxAttempts - stored.attempts;
            return {
                success: false,
                message: `Invalid OTP. ${remaining > 0 ? `${remaining} attempt(s) remaining.` : 'Please request a new OTP.'}`
            };
        }
    } catch (error) {
        console.error('Error verifying OTP:', error);
        return {
            success: false,
            error: error.message,
            message: 'Failed to verify OTP'
        };
    }
};