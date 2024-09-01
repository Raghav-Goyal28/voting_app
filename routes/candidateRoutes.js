const express=require("express");
const router=express.Router();
const Candidate= require("./../models/candidate");
const User= require("../models/user");
const {jwtAuthMiddleware, generateToken} = require('../jwt');

const checkAdminRole = async (userID) => {
    try{
         const user = await User.findById(userID);
         if(user.role === 'admin'){
             return true;
         }
    }catch(err){
         return false;
    }
 }

// POST route to add a candidate
router.post('/', jwtAuthMiddleware,async (req, res) =>{
    try{
        if(!(await checkAdminRole(req.user.id)))
            return res.status(403).json({message: 'user does not have admin role'});

        const data = req.body // Assuming the request body contains the candidate data

        // Create a new User document using the Mongoose model
        const newCandidate = new Candidate(data);

        // Save the new user to the database
        const response = await newCandidate.save();
        console.log('data saved');
        res.status(200).json({response: response});
    }
    catch(err){
        console.log(err);
        res.status(500).json({error: 'Internal Server Error'});
    }
})

router.put('/:candidateID', jwtAuthMiddleware, async (req, res)=>{
    try{
        if(!checkAdminRole(req.user.id))
            return res.status(403).json({message: 'user does not have admin role'});
        
        const candidateID = req.params.candidateID; // Extract the id from the URL parameter
        const updatedCandidateData = req.body; // Updated data for the person

        const response = await Candidate.findByIdAndUpdate(candidateID, updatedCandidateData, {
            new: true, // Return the updated document
            runValidators: true, // Run Mongoose validation
        })

        if (!response) {
            return res.status(404).json({ error: 'Candidate not found' });
        }

        console.log('candidate data updated');
        res.status(200).json(response);
    }catch(err){
        console.log(err);
        res.status(500).json({error: 'Internal Server Error'});
    }
})

router.delete('/:candidateID', jwtAuthMiddleware, async (req, res)=>{
    try{
        if(!checkAdminRole(req.user.id))
            return res.status(403).json({message: 'user does not have admin role'});
        
        const candidateID = req.params.candidateID; // Extract the id from the URL parameter

        const response = await Candidate.findByIdAndDelete(candidateID);

        if (!response) {
            return res.status(404).json({ error: 'Candidate not found' });
        }

        console.log('candidate deleted');
        res.status(200).json(response);
    }catch(err){
        console.log(err);
        res.status(500).json({error: 'Internal Server Error'});
    }
})
// voting
router.post('/vote/:candidateID',jwtAuthMiddleware,async(req,res)=>{
    candidateID=req.params.candidateID;
    userId=req.user.id;
    try{
// find candiadate by candidate id
const candidate= await Candidate.findById( candidateID);
if(!candidate){
    return req.status(404).json({ message: 'Candidate not found' });
}
const user=await User.findById(userId);
if(!user){
    return req.status(404).json({ message: 'User not found' });
}

if(user.isVoted){
    return res.status(400).json({message:'alreadeyvote'})
}
if(user.role == 'admin'){
    return res.status(403).json({ message: 'admin is not allowed'});
}

//update candidate document to record vote
candidate.votes.push({user:userId});
candidate.voteCount++;
await candidate.save();

//update userdoc
user.isVoted=true
await candidate.save();

res.status(200).json({message:'record succefully'});
    }
    catch{
        res.status(500).json({error: 'Internal Server Error'});
    }
})

//votecount
router.get('/vote/count',async(req,res)=>{
    try{
    //find all candidate and sort them by votecount desc
    const candidate=await Candidate.find().sort({voteCount:'desc'});

    // Map candidates to only return name and votecount
    const VoteRecord=candidate.map((data)=>{
return{
    party:data.party,
    count:data.voteCount
}
    });
    res.status(200).json(VoteRecord);
    }
    catch{
        res.status(500).json({error: 'Internal Server Error'})
    }

})

// Get List of all candidates with only name and party 
router.get('/', async (req, res) => {
    try {
        // Find all candidates and select only the name and party =, excluding _id
        const candidates = await Candidate.find({}, 'name party -_id');

        // Return the list of candidates
        res.status(200).json(candidates);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;  
