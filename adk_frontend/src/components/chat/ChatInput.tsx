"use client;"

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowUp } from "@fortawesome/free-solid-svg-icons";
import styles from "./chat.module.css";
import { useEffect, useState } from "react";
import { useSession } from "@/hooks/useSession";
import { useRouter } from "next/navigation";
import { OrbitProgress } from "react-loading-indicators";

// Simple UUID generator
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

interface ChatInputProps {
    sessionId?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sendMessage?: any;
    messageLoading?: boolean
}

export default function ChatInput({ sessionId, sendMessage, messageLoading }: ChatInputProps) {
    const [input, setInput] = useState("");
    const [sessionName, setSessionName] = useState("");
    const [displayError, setDisplayError] = useState("");
    const { create } = useSession();
    const { createSession, loading, error, response } = create
    const router = useRouter();

    useEffect(() => {
        if (response && response?.id) {
            localStorage.setItem("message", input)
            router.push(`/chat/${response.id}`);
        }
    }, [response, router, input]);

    const handleSubmit = async () => {
        if (!input.trim()) {
            setDisplayError("Prompt is empty")
            return
        }
        if (!sessionId) {
            if (!sessionName || sessionName == "" || sessionName.length <= 3) {
                setDisplayError("Session name is empty")
                return
            }
            const sessionUUId = generateUUID();
            const userId = localStorage.getItem("username"); // Placeholder user id
            const state = { "name": sessionName.trim(), "history": [] };
            await createSession(userId, sessionUUId, state);
        } else {
            await sendMessage(input.trim(), sessionId)
            setInput("")
        }
    };

    return <div className={styles.inputContainer}>
        {
            displayError != "" &&
            <span className={styles.errorMessage}>{displayError}</span>
        }
        {
            !sessionId && <input
                type="text"
                value={sessionName}
                onChange={e => setSessionName(e.target.value)}
                className={styles.inputField + " " + styles.nameInputField}
                id="session_name"
                placeholder="Session name. Example: Greedy algorithm"
            />
        }
        <textarea
            className={styles.inputField}
            value={input}
            id="message"
            onChange={e => setInput(e.target.value)}
            placeholder="Enter prompt here. To use github use following format: Owner=ritwikmath,repository=dsa,branch=main,filepath=array/dummy.py"
        ></textarea>
        {
            loading || messageLoading ? 
            <OrbitProgress color="#FFC857" size="small" text="" />
            :
            <div className={styles.submitButton} onClick={handleSubmit}>
                <FontAwesomeIcon icon={faArrowUp} />
            </div>
        }
        {error && <div style={{ color: 'red' }}>{error}</div>}
    </div>
}
