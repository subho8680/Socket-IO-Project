import mongoose from "mongoose";
const quizSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    questions:[
        {
            title:{
                type:String,
                required:true
            },
            options:[
                String
            ],
            correctOption:{
                quesionNo:{
                    type:String
                },
                answer:{
                    type:String
                }
            }
        }
    ],
    createdBy:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"TeacherModel"
    }
})
export const quizModel = mongoose.model("quizModel",quizSchema);