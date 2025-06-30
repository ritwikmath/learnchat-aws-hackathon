"use client";

import ChatContainer from "@/components/chat/ChatContainer";
import styles from "../page.module.css";
import Navigation from "@/components/Navigation";
import { useParams, useRouter } from "next/navigation";
import { useChat } from "@/hooks/useChat";
import { useEffect } from "react";
import { useSession } from "@/hooks/useSession";

export default function Chat() {
    const params = useParams();
    const session = params.session as string;
    
    const { setMessages, messages, loading, sendMessage } = useChat([])
    const { fetchOne } = useSession()
    const { fetchSessionDetails, response } = fetchOne

    const router = useRouter();

    useEffect(() => {
        // Check if username exists in localStorage
        const username = localStorage.getItem("username");
        if (!username) {
            // Redirect to home page if no username found
            router.push("/");
        }
    }, [router]);

    useEffect(() => {
        const message = localStorage.getItem("message")
        localStorage.removeItem("message")
        if (message) {
            sendMessage(message, session)
        } else {
            const username = localStorage.getItem("username")
            if (username)
                fetchSessionDetails(username, session)
            else
                router.push("/");
        }
    }, [setMessages, sendMessage, session, fetchSessionDetails, router])

    useEffect(() => {
        if (!Array.isArray(response) && messages.length < 1) {
            response?.state?.history.forEach(message => {
                setMessages(prevMessages => [...prevMessages, message]);
            })
        }
    }, [response, setMessages, messages])

    return <div className={styles.chatPage}>
        <Navigation />
        <ChatContainer messages={messages} sessionId={session} sendMessage={sendMessage} messageLoading={loading}  />
    </div>
}