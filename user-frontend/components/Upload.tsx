"use client";
import { PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import {  UploadValue } from "@/components/UploadImage";
import { BACKEND_URL } from "@/utils";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useWallet, useConnection } from '@solana/wallet-adapter-react';

export const Upload = () => {
    const [values, setValues] = useState<string[]>([]);
    const [title, setTitle] = useState("");
    const [option, setOption] = useState("");
    const [txSignature, setTxSignature] = useState("");
    const { publicKey, sendTransaction } = useWallet();
    const { connection } = useConnection();
    const router = useRouter();

    async function onSubmit() {
        const response = await axios.post(`${BACKEND_URL}/v1/user/task`, {
            options: values.map(value => ({
                value: value,
            })),
            title,
            signature: txSignature
        }, {
            headers: {
                "Authorization": localStorage.getItem("token")
            }
        })

        router.push(`/task/${response.data.id}`)
    }

    async function makePayment() {

        const transaction = new Transaction().add(
            SystemProgram.transfer({
                fromPubkey: publicKey!,
                toPubkey: new PublicKey("2KeovpYvrgpziaDsq8nbNMP4mc48VNBVXb5arbqrg9Cq"),
                lamports: 100000000,
            })
        );

        const {
            context: { slot: minContextSlot },
            value: { blockhash, lastValidBlockHeight }
        } = await connection.getLatestBlockhashAndContext();

        const signature = await sendTransaction(transaction, connection, { minContextSlot });

        await connection.confirmTransaction({ blockhash, lastValidBlockHeight, signature });
        setTxSignature(signature);
    }

    const addOption = ()=>{
        setValues([...values, option]);
        setOption("");
    }

    return <div className="flex justify-center">
        <div className="max-w-screen-lg w-full">
            <div className="text-2xl text-left pt-20 w-full pl-4">
                Create a task
            </div>

            <label className="pl-4 block mt-2 text-md font-medium text-gray-900 text-black">Task details</label>

            <input onChange={(e) => {
                setTitle(e.target.value);
            }} type="text" id="first_name" className="ml-4 mt-1 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" placeholder="What is your task?" required />

            <label className="pl-4 block mt-8 text-md font-medium text-gray-900 text-black">Add Options</label>
            <div className="flex justify-center pt-4 max-w-screen-lg">
                {values.map(value => <p className='bg-black mx-4 my-2 text-white px-3 py-3'>{value}</p>)}
            </div>


        <div className="ml-4 pt-2 flex justify-center">
            <input className='bg-black text-white py-4 px-2 mx-2 my-4'
            value={option}
            onChange = {
                (e)=>setOption(e.target.value)
            }
            />
            <button onClick={addOption}>Add this option</button>
        </div>        

        <div className="flex justify-center">
            <button onClick={txSignature ? onSubmit : makePayment} type="button" className="mt-4 text-white bg-gray-800 hover:bg-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-300 font-medium rounded-full text-sm px-5 py-2.5 me-2 mb-2 dark:bg-gray-800 dark:hover:bg-gray-700 dark:focus:ring-gray-700 dark:border-gray-700">
                {txSignature ? "Submit Task" : "Pay 0.1 SOL"}
            </button>
        </div>
        
      </div>
    </div>
}