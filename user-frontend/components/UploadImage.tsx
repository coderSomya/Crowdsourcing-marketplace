"use client"
import { BACKEND_URL, CLOUDFRONT_URL } from "@/utils";
import axios from "axios";
import { useState } from "react"

export function UploadValue({ onValueAdded, value }: {
    onValueAdded: (value: string) => void;
    value?: string;
}) {
    const [uploading, setUploading] = useState(false);


    if (value) {
        return <p>{value}</p>
    }

    return <p>upload image</p>
}