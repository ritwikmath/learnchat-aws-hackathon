"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import ChatContainer from "@/components/chat/ChatContainer";
import styles from "./page.module.css";
import Navigation from "@/components/Navigation";

export default function Chat() {
    const router = useRouter();

    useEffect(() => {
        // Check if username exists in localStorage
        const username = localStorage.getItem("username");
        if (!username) {
            // Redirect to home page if no username found
            router.push("/");
        }
    }, [router]);

    return <div className={styles.chatPage}>
        <Navigation />
        <ChatContainer />
    </div>
}