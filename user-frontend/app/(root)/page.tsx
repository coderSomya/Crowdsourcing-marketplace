"use client";
import { Appbar } from "@/components/Appbar";
import { Hero } from "@/components/Hero";
import { Upload } from "@/components/Upload";
import Image from "next/image";
import { useState } from "react";

export default function Home() {

  return (
    <main>
      <Appbar />
      <Hero />
      <Upload />
    </main>
  );
}
