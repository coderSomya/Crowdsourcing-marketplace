"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const express_1 = require("express");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const middleware_1 = require("../middleware");
const types_1 = require("../types");
const router = (0, express_1.Router)();
const prismaClient = new client_1.PrismaClient();
router.get('/', (req, res) => res.send("user router working"));
router.post('/task', middleware_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const body = req.body;
    //@ts-ignore
    const userId = req.userId;
    const parsedData = types_1.createTaskInput.safeParse(body);
    if (!parsedData.success) {
        return res.status(411).json({
            message: "Wrong input"
        });
    }
    let response = yield prismaClient.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield tx.task.create({
            data: {
                title: parsedData.data.title,
                amount: 1 * 1000,
                signature: parsedData.data.signature,
                user_id: userId
            }
        });
        yield tx.option.createMany({
            data: parsedData.data.options.map((x) => ({
                value: x.value,
                task_id: response.id
            }))
        });
        return response;
    }));
    res.json({
        id: response.id
    });
}));
router.get('/task', middleware_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    //@ts-ignore
    const taskId = req.query.taskId;
    //@ts-ignore
    const userId = req.userId;
    const taskDetails = yield prismaClient.task.findFirst({
        where: {
            user_id: Number(userId),
            id: Number(taskId)
        },
        include: {
            options: true
        }
    });
    if (!taskDetails) {
        return res.status(411).json({
            message: "you dont have access to this task"
        });
    }
    const response = yield prismaClient.submission.findMany({
        where: {
            task_id: Number(taskId),
        },
        include: {
            option: true
        }
    });
    const result = {};
    taskDetails.options.forEach(option => {
        result[option.id] = {
            count: 0,
            option: {
                value: option.value
            }
        };
    });
    response.forEach(r => {
        result[r.option_id].count++;
    });
    res.json({
        result
    });
}));
router.post('/signin', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const hardcoderWalletAddress = "fkejfklefklerkr";
    const existingUser = yield prismaClient.user.findFirst({
        where: {
            address: hardcoderWalletAddress
        }
    });
    if (existingUser) {
        const token = jsonwebtoken_1.default.sign({
            userId: existingUser.id
        }, "jwt-secret");
        res.json({
            token
        });
    }
    else {
        const user = yield prismaClient.user.create({
            data: {
                address: hardcoderWalletAddress
            }
        });
        const token = jsonwebtoken_1.default.sign({
            userId: user.id
        }, "jwt-secret");
        res.json({
            token
        });
    }
}));
exports.default = router;
