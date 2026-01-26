"use client"


import { useRouter } from "next/navigation";



export default function Home() {


  const router = useRouter()


  
  return (
    <div>Home <span className="icon-[mdi-light--home]"></span></div>
  );
}
