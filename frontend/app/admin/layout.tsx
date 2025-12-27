import AuthGuard from "@/components/guards/AuthGuard";
import RoleGuard from "@/components/guards/RoleGuard";
import Navbar from "@/components/Navbar";
import React from "react";



export default function AdminLayout({children}:{children:React.ReactNode}){
    return(
        <AuthGuard>
            <RoleGuard allowedRoles={["ADMIN"]}>
                <Navbar role="ADMIN"/>
                {children}
            </RoleGuard>
        </AuthGuard>
    )
}