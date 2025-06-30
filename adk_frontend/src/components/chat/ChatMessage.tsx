import styles from "./chat.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRobot } from "@fortawesome/free-solid-svg-icons";

type MessageProps = {
    message: string,
    owner: string
}

import ReactMarkdown from 'react-markdown';
// import remarkGfm from 'remark-gfm'; // For GitHub Flavored Markdown (tables, task lists, etc.)
// import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
// import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism'; // Choose your style

const MarkdownRenderer = ({ markdown }) => {
  return (
    <ReactMarkdown
    //   remarkPlugins={[remarkGfm]} // Add plugins as needed
      components={{
        // Custom component for code blocks with syntax highlighting
        code({ className, children, ...props }) {
          return <code className={className} {...props}>
              {children}
            </code>;
        },
        // You can override any HTML element here for custom styling or behavior
        // h1: ({ children }) => <h1 className="text-4xl text-blue-600">{children}</h1>,
      }}
    >
      {markdown}
    </ReactMarkdown>
  );
};

export default function ChatMessage({ message, owner }: MessageProps) {
    return <div className={owner == "system" ? styles.systemMessage : styles.userMessage}>
        {
            owner == "system" && <FontAwesomeIcon className={styles.robotIcon} icon={faRobot} />
        }
        <MarkdownRenderer markdown={message} />
    </div>
}