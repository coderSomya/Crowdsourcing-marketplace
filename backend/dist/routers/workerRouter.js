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
const express_1 = __importDefault(require("express"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const middleware_1 = require("../middleware");
const db_1 = require("../db");
const types_1 = require("../types");
const router = express_1.default.Router();
const prismaClient = new client_1.PrismaClient();
const TOTAL_DECIMALS = 1000;
const TOTAL_SUBMISSION = 100;
router.get('/', (req, res) => res.send("worker works"));
router.post('/signin', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const hardcoderWalletAddress = "fkejfkfelfdllefklerkr";
    const existingWorker = yield prismaClient.worker.findFirst({
        where: {
            address: hardcoderWalletAddress
        }
    });
    if (existingWorker) {
        const token = jsonwebtoken_1.default.sign({
            userId: existingWorker.id
        }, "jwt-secret-worker");
        res.json({
            token
        });
    }
    else {
        const worker = yield prismaClient.worker.create({
            data: {
                address: hardcoderWalletAddress,
                pending_amount: 0,
                locked_amount: 0,
            }
        });
        const token = jsonwebtoken_1.default.sign({
            userId: worker.id
        }, "jwt-secret-worker");
        res.json({
            token
        });
    }
}));
router.get('/next-task', middleware_1.workerMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    //@ts-ignore
    const userId = req.userId;
    const task = yield (0, db_1.getNextTask)(Number(userId));
    if (!task) {
        res.status(411).json({
            message: "No more tasks for you"
        });
    }
    res.json({ task });
}));
router.post('/submission', middleware_1.workerMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    //@ts-ignore
    const userId = req.userId;
    const body = req.body;
    const parsedBody = types_1.createSubmissionInput.safeParse(body);
    if (parsedBody.success) {
        const task = yield (0, db_1.getNextTask)(userId);
        if (!task || task.id !== Number(parsedBody.data.taskId)) {
            return res.status(411).json({
                message: "you cant make a submission for this task"
            });
        }
        const amount = (Number(task.amount) / TOTAL_SUBMISSION).toString();
        const submission = yield prismaClient.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            const submission = yield tx.submission.create({
                data: {
                    option_id: Number(parsedBody.data.selection),
                    worker_id: userId,
                    task_id: Number(task.id),
                    amount: Number(amount)
                }
            });
            yield prismaClient.worker.update({
                where: {
                    id: userId,
                },
                data: {
                    pending_amount: {
                        increment: Number(amount)
                    }
                }
            });
            return submission;
        }));
        const newTask = yield (0, db_1.getNextTask)(Number(userId));
        return res.json({
            newTask,
            amount
        });
    }
    else {
        res.status(411).json({ message: "invalid body", "body": parsedBody });
    }
}));
router.get('/balance', middleware_1.workerMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    //@ts-ignore
    const userId = req.userId;
    const worker = yield prismaClient.worker.findFirst({
        where: {
            id: Number(userId),
        }
    });
    res.json({
        pending_amount: worker === null || worker === void 0 ? void 0 : worker.pending_amount,
        locked_amount: worker === null || worker === void 0 ? void 0 : worker.locked_amount
    });
}));
exports.default = router;
