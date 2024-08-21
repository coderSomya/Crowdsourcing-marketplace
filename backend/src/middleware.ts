import { NextFunction, Request, Response} from "express";
import jwt from "jsonwebtoken";

export const authMiddleware = (req: Request, res: Response, next: NextFunction) =>{
    const authHeader = req.headers['authorization'] ?? "";

    try {
        const decoded = jwt.verify(authHeader, "jwt-secret");
        //@ts-ignore
        if(decoded.userId){
            //@ts-ignore
            req.userId = decoded.userId;
            return next();
        }
        else{
            return res.status(403).json({
                message: "You are not logged in"
            })            
        }
    } catch (error) {
        return res.status(403).json({
            message: "You are not logged in"
        })
    }
}

export const workerMiddleware = (req: Request, res: Response, next: NextFunction) =>{
    const authHeader = req.headers['authorization'] ?? "";

    try {
        const decoded = jwt.verify(authHeader, "jwt-secret-worker");
        //@ts-ignore
        if(decoded.userId){
            //@ts-ignore
            req.userId = decoded.userId;
            return next();
        }
        else{
            return res.status(403).json({
                message: "You are not logged in"
            })            
        }
    } catch (error) {
        return res.status(403).json({
            message: "You are not logged in"
        })
    }
}