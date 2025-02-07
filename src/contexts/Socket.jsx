import { createContext, useContext, useMemo } from "react"; 
import { io } from "socket.io-client";

export const SocketContext = createContext();

export const useSocket = () => {
    return useContext(SocketContext);
}  

export const SocketProvider = ({ children }) => {
    const socket = useMemo(() => io('http://localhost:3000'), []);

    return <SocketContext.Provider value={{ socket }}>{children}</SocketContext.Provider>
}

