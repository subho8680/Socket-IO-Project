import jwt from "jsonwebtoken"
export const isAuthenticated = async(req,res,next)=>{
    try{
        const token = req.cookies.token;
        if(!token){
            return res.status(400).json({
                msg:"User not Authenticated log in first",
                success:false
            })
        }
        const decode = await jwt.verify(token,process.env.SECRET_KEY)
        if(!decode){
            return res.status(400).json({
                msg:"Invalid Token",
                success:false
            })
        }

        req.id = decode.userId;
        next()
    }
    catch(e){
        console.log(e);
    }
    
}