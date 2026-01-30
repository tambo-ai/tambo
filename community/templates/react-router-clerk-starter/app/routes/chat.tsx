import { MessageThreadFull } from "~/components/tambo/message-thread-full";


export default function ChatPage() {
    return (
        <div className="h-screen w-full bg-background">
            <MessageThreadFull contextKey="tambo-template" />
        </div>
    );
}
