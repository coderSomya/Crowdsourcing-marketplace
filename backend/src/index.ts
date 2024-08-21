import express from 'express';
const app = express();
import cors from "cors";

import {router as userRouter} from "./routers/userRouter"
import {router as workerRouter} from './routers/workerRouter';


app.use(express.json());
app.use(cors({
    origin: "*"
}));

app.use("/v1/user", userRouter);
app.use("/v1/worker", workerRouter);

app.get('/', (req, res) => {
    res.send("something")
})

app.listen(4000, ()=>{
    console.log('app listening on port 4000');
})


