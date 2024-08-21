import { PrismaClient } from '@prisma/client';
import {Router} from 'express';
import jwt from 'jsonwebtoken';
import { authMiddleware } from '../middleware';
import { createTaskInput } from '../types';
import nacl from "tweetnacl";
import { Connection, PublicKey, Transaction } from "@solana/web3.js";

export const router = Router();

const PARENT_WALLET_ADDRESS = "5Hf5gTBbXpfWGFMqRGzkHp65PYMfsTsoaMAVzE5uvahs";

const connection = new Connection("https://solana-mainnet.g.alchemy.com/v2/8ry9GfGDMzycLvFEM712WEhurvHLQgEY");


const prismaClient = new PrismaClient();

router.get('/', (req,res)=> res.send("user router working"))

router.post("/task", authMiddleware, async (req, res) => {
    //@ts-ignore
    const userId = req.userId
    // validate the inputs from the user;
    const body = req.body;

    const parseData = createTaskInput.safeParse(body);

    const user = await prismaClient.user.findFirst({
        where: {
            id: userId
        }
    })

    if (!parseData.success) {
        return res.status(411).json({
            message: "You've sent the wrong inputs"
        })
    }

    const transaction = await connection.getTransaction(parseData.data.signature, {
        maxSupportedTransactionVersion: 1
    });

    console.log(transaction);

    if ((transaction?.meta?.postBalances[1] ?? 0) - (transaction?.meta?.preBalances[1] ?? 0) !== 100000000) {
        return res.status(411).json({
            message: "Transaction signature/amount incorrect"
        })
    }

    if (transaction?.transaction.message.getAccountKeys().get(1)?.toString() !== PARENT_WALLET_ADDRESS) {
        return res.status(411).json({
            message: "Transaction sent to wrong address"
        })
    }

    if (transaction?.transaction.message.getAccountKeys().get(0)?.toString() !== user?.address) {
        return res.status(411).json({
            message: "Transaction sent to wrong address"
        })
    }
    // was this money paid by this user address or a different address?

    // parse the signature here to ensure the person has paid 0.1 SOL
    // const transaction = Transaction.from(parseData.data.signature);

    let response = await prismaClient.$transaction(async tx => {

        const response = await tx.task.create({
            data: {
                title: parseData.data.title ?? "",
                amount: 0.1 * 1000,
                //TODO: Signature should be unique in the table else people can reuse a signature
                signature: parseData.data.signature,
                user_id: userId
            }
        });

        await tx.option.createMany({
            data: parseData.data.options.map(x => ({
                value: x.value,
                task_id: response.id
            }))
        })

        return response;

    })

    res.json({
        id: response.id
    })

})

router.get('/task', authMiddleware, async (req,res)=>{
    //@ts-ignore
    const taskId: string = req.query.taskId;
    //@ts-ignore
    const userId: string = req.userId;

    const taskDetails = await prismaClient.task.findFirst({
        where:{
            user_id: Number(userId),
            id: Number(taskId)
        },
        include:{
            options: true
        }
    })

    if(!taskDetails){
        return res.status(411).json({
            message: "you dont have access to this task"
        })
    }

    const response = await prismaClient.submission.findMany({
        where:{
            task_id: Number(taskId),
        },
        include:{
            option: true
        }
    });

    const result: Record<string,{
        count: number,
        option: {
            value: string
        }
    }> = {};

    taskDetails.options.forEach(option =>{
        result[option.id]={
            count: 0,
            option: {
                value: option.value
            }
    }});

    response.forEach(r=>{
        result[r.option_id].count++;
    })

    res.json({
        result
    })
})

router.post("/signin", async(req, res) => {
    const { publicKey, signature } = req.body;
    const message = new TextEncoder().encode("Sign into mechanical turks");

    const result = nacl.sign.detached.verify(
        message,
        new Uint8Array(signature.data),
        new PublicKey(publicKey).toBytes(),
    );


    if (!result) {
        return res.status(411).json({
            message: "Incorrect signature"
        })
    }

    const existingUser = await prismaClient.user.findFirst({
        where: {
            address: publicKey
        }
    })

    if (existingUser) {
        const token = jwt.sign({
            userId: existingUser.id
        }, "jwt-secret")

        res.json({
            token
        })
    } else {
        const user = await prismaClient.user.create({
            data: {
                address: publicKey,
            }
        })

        const token = jwt.sign({
            userId: user.id
        }, "jwt-secret")

        res.json({
            token
        })
    }
});

export default router;