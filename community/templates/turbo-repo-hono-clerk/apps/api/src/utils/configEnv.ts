import dotenv from 'dotenv';
dotenv.config();

export const ENV_PARSER = {
    PORT: process.env.PORT || '3000',
    MONGO_URI: process.env.MONGO_URI || '',
    CLIENT_URL: process.env.CLIENT_URL || '',
}