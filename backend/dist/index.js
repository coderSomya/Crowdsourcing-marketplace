"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const app = (0, express_1.default)();
const userRouter_1 = __importDefault(require("./routers/userRouter"));
const workerRouter_1 = __importDefault(require("./routers/workerRouter"));
app.use(express_1.default.json());
app.use("/v1/user", userRouter_1.default);
app.use("/v1/worker", workerRouter_1.default);
app.get('/', (req, res) => {
    res.send("something");
});
app.listen(4000, () => {
    console.log('app listening on port 4000');
});
