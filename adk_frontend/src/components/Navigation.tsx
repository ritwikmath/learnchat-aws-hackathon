import { faPlus, faSignOutAlt } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from 'next/link'
import { useRouter } from 'next/navigation';
import styles from "./navigation.module.css";
import { useSession } from "@/hooks/useSession";
import { useEffect, memo } from "react";
import NavigationMenuItem from "./NavigationMenuItem";


const Navigation = memo(function Navigation() {

    const { fetchAll } = useSession();
    const { fetchSessions, response } = fetchAll
    const router = useRouter();

    useEffect(() => {
        const username = localStorage.getItem("username")
        if (username)
            fetchSessions(username)
    }, [fetchSessions])

    const handleLogout = () => {
        // Remove username from localStorage
        localStorage.removeItem("username");
        // Redirect to home page
        router.push("/");
    };
    

    return <div className={styles.leftMenu}>
            <div className={styles.topMenu}>
                <Link href="/chat">
                    <div className={styles.menuText}>
                        <FontAwesomeIcon icon={faPlus} />
                        New Chat
                    </div>
                </Link>
                {/* <div className={styles.menuText}>
                    <FontAwesomeIcon icon={faSearch} />
                    <span>Search Chat</span>
                </div> */}
            </div>
            <div className={styles.bottomMenu}>
                <h4>Chats</h4>
                <div className={styles.chatList}>
                    {
                        response && response.map((session, index) => {
                            return <NavigationMenuItem key={index} id={session?.id} resetSessions={fetchSessions} />
                        })
                    }
                </div>
            </div>
            <div className={styles.logoutButton}>
                <button onClick={handleLogout} className={styles.logoutBtn}>
                    <FontAwesomeIcon icon={faSignOutAlt} />
                    Logout
                </button>
            </div>
        </div>
})

export default Navigation;