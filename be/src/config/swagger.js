import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { fileURLToPath } from "node:url";
import path from "node:path";

const currentFile = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFile);

const swaggerOptions = {
    definition: {
        openapi: "3.0.3",
        info: {
            title: process.env.SWAGGER_TITLE || "Troeasy API",
            version: process.env.SWAGGER_VERSION || "1.0.0",
            description:
                process.env.SWAGGER_DESCRIPTION ||
                "Tài liệu API được tạo từ các chú thích OpenAPI trong mã nguồn.",
        },
        servers: [
            {
                url: process.env.API_URL || `http://localhost:${process.env.PORT || 9000}`,
                description: process.env.API_URL ? "API server" : "Local development server",
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                },
            },
            schemas: {
                AuthUser: {
                    type: "object",
                    properties: {
                        id: { type: "string", example: "665f1a2b3c4d5e6f78901234" },
                        username: { type: "string", example: "admin" },
                        fullName: { type: "string", nullable: true, example: "Admin" },
                    },
                },
                AuthError: {
                    type: "object",
                    properties: {
                        success: { type: "boolean", example: false },
                        message: { type: "string", example: "Username hoặc mật khẩu không đúng." },
                    },
                },
                User: {
                    type: "object",
                    properties: {
                        id: { type: "string", example: "665f1a2b3c4d5e6f78901234" },
                        username: { type: "string", example: "user01" },
                        fullName: { type: "string", nullable: true, example: "Nguyen Van A" },
                        isActive: { type: "boolean", example: true },
                        createdAt: { type: "string", format: "date-time" },
                        updatedAt: { type: "string", format: "date-time" },
                    },
                },
            },
        },
    },
    // Quét file JavaScript trong src, gồm cả route và controller có JSDoc @openapi.
    apis: [path.resolve(currentDir, "../**/*.js").replace(/\\/g, "/")],
};

const swaggerSpec = swaggerJSDoc(swaggerOptions);

/** Gắn Swagger UI và file OpenAPI JSON vào Express app. */
const swaggerDocs = (app) => {
    const docsPath = process.env.SWAGGER_PATH || "/api-docs";

    app.get(`${docsPath}.json`, (_req, res) => {
        res.json(swaggerSpec);
    });

    app.use(
        docsPath,
        swaggerUi.serve,
        swaggerUi.setup(swaggerSpec, {
            explorer: true,
            customSiteTitle: `${swaggerOptions.definition.info.title} - API Docs`,
        }),
    );

    const serverUrl = process.env.API_URL || `http://localhost:${process.env.PORT || 9000}`;
    console.log(`Swagger UI: ${serverUrl}${docsPath}`);
};

export { swaggerSpec };
export default swaggerDocs;
