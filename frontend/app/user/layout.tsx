import AuthGuard from "@/components/guards/AuthGuard";
import RoleGuard from "@/components/guards/RoleGuard";
import Navbar from "@/components/Navbar";
import React from "react";



export default function UserLayout({children}:{children:React.ReactNode}){
    return(
        <AuthGuard>
            <RoleGuard allowedRoles={["USER"]}>
                <Navbar role="USER"/>
                {children}
            </RoleGuard>
        </AuthGuard>
    )
}