"use client;"

import { useSession } from "@/hooks/useSession"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useEffect } from "react"
import Styles from "./navigation.module.css"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faTrash, faExclamationTriangle } from "@fortawesome/free-solid-svg-icons"
import React from "react"
import { useRouter } from "next/navigation"
import Button from "./ui/Button"

type MenuItem = {
    id: string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resetSessions: any
}

export default function NavigationMenuItem({ id, resetSessions }: MenuItem) {
    const params = useParams();
    const session = params.session as string;

    const router = useRouter()

    const { fetchOne } = useSession()
    const { fetchSessionDetails, loading, response } = fetchOne

    
    const { deleteOne } = useSession();
    const { deleteSessionDetails } = deleteOne

    const [showModal, setShowModal] = React.useState(false);

    useEffect(() => {
        const username = localStorage.getItem("username")
        if (username)
            fetchSessionDetails(username, id)
    }, [fetchSessionDetails, id])

    const deleteSession = async (id: string) => {
        const username = localStorage.getItem("username")
        if (username)
            await deleteSessionDetails(username, id)
            resetSessions(username)
            router.push(`/chat`)
    }

    // Truncate session name to 15 characters with ellipsis if longer
    const sessionName = response?.state?.name
        ? response.state.name.length > 15
            ? response.state.name.slice(0, 15) + "..."
            : response.state.name
        : "";

    return !loading && (
        <>
            <div className={Styles.menuItemContainer}>
                <Link href={`/chat/${id}`} className={session == id ? Styles.Active : ""} style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sessionName}</Link>
                <FontAwesomeIcon icon={faTrash} style={{ color: '#F14A41', fontSize: 16, cursor: 'pointer' }} onClick={() => setShowModal(true)} />
            </div>
            {showModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: '#23272F', padding: 32, borderRadius: 16, minWidth: 340, boxShadow: '0 8px 32px rgba(0,0,0,0.35)', display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: '90vw' }}>
                        <FontAwesomeIcon icon={faExclamationTriangle} style={{ color: '#F14A41', fontSize: 36, marginBottom: 16 }} />
                        <div style={{ color: '#fff', fontWeight: 600, fontSize: 20, marginBottom: 8, textAlign: 'center' }}>Delete Session?</div>
                        <div style={{ color: '#bbb', fontSize: 15, marginBottom: 28, textAlign: 'center', maxWidth: 280 }}>
                            Are you sure you want to delete this session? This action cannot be undone.
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, width: '100%' }}>
                            <Button variant="secondary" className="modal-btn" onClick={() => setShowModal(false)}>
                                Cancel
                            </Button>
                            <Button variant="primary" className="modal-btn" onClick={async () => { await deleteSession(id); setShowModal(false); }}>
                                Delete
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}