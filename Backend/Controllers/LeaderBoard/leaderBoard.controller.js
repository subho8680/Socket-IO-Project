import { quizPerfModel } from "../../Models/QuizPerformance/quizPerformance.js";

export const getLeaderBoard = async(roomId)=>{
    try{
        
        const users = await quizPerfModel.find({
            roomId:roomId,
            
        }).sort({points:-1}).populate("createdBy")
        return users
    }
    catch(e){
        console.log(e);
        
    }
}