import winston from 'winston';

// Cấu hình Logger dùng Winston Console Transport
const Logger = winston.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: winston.format.printf(({ message }) => message), // Giữ nguyên định dạng màu sắc từ chuỗi truyền vào
    transports: [
        new winston.transports.Console({
            handleExceptions: true
        })
    ],
    exitOnError: false
});

export default Logger;
