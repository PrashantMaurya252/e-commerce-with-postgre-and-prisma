
import React from "react";
import UserClientLayout from "./UserLayout";



export default function UserLayout({children}:{children:React.ReactNode}){
    return(
        <UserClientLayout>
            {children}
        </UserClientLayout>
    )
}