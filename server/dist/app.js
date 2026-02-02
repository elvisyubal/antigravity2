"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
// Routes
const auth_1 = __importDefault(require("./routes/auth"));
const products_1 = __importDefault(require("./routes/products"));
const sales_1 = __importDefault(require("./routes/sales"));
const clients_1 = __importDefault(require("./routes/clients"));
const catalog_1 = __importDefault(require("./routes/catalog"));
const cash_1 = __importDefault(require("./routes/cash"));
const reports_1 = __importDefault(require("./routes/reports"));
const config_1 = __importDefault(require("./routes/config"));
dotenv_1.default.config();
const app = (0, express_1.default)();
// Middleware
app.use(express_1.default.json());
app.use((0, cors_1.default)({
    origin: '*',
    credentials: false, // JWT is in headers, not cookies
}));
app.use((0, helmet_1.default)());
app.use((0, morgan_1.default)('dev'));
// Health check
app.get('/', (req, res) => {
    res.json({ message: 'Botica J&M API is running', version: '1.0.0' });
});
// API Routes
app.use('/api/auth', auth_1.default);
app.use('/api/products', products_1.default);
app.use('/api/sales', sales_1.default);
app.use('/api/clients', clients_1.default);
app.use('/api/catalog', catalog_1.default);
app.use('/api/cash', cash_1.default);
app.use('/api/reports', reports_1.default);
app.use('/api/config', config_1.default);
// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Error interno del servidor' });
});
exports.default = app;
