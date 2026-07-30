import mongoose from "mongoose";
const connectDB = async () =>{
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log(`mogodb connected successfully`);

        const db = mongoose.connection.db;
        try {
            const indexes = await db.collection("submissions").indexes();
            const hasCfSubmissionIndex = indexes.some(
                (index) => index.name === "cfSubmissionId_1",
            );
            if (hasCfSubmissionIndex) {
                await db.collection("submissions").dropIndex("cfSubmissionId_1");
                console.log("Dropped stale cfSubmissionId_1 index from submissions collection");
            }
        } catch (indexError) {
            if (indexError.codeName !== "IndexNotFound") {
                console.log("Error checking/dropping submission indexes:", indexError);
            }
        }
    } catch (error) {
        console.log(error);
    }
}
export default connectDB